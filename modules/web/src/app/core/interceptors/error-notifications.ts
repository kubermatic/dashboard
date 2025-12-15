// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable, Injector, OnDestroy} from '@angular/core';
import {NotificationService} from '@core/services/notification';
import {Observable} from 'rxjs';
import {take, tap} from 'rxjs/operators';
import {SettingsService} from '@core/services/settings';
import {AdminSettings} from '@shared/entity/settings';
import {CLUSTER_AUTOSCALING_APP_DEF_NAME} from '@app/shared/entity/application';
import {
  ErrorTrackingEntry,
  ErrorThrottlingConfig,
  DEFAULT_THROTTLING_CONFIG,
  MILLISECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
} from './error-throttling.config';

export interface APIError {
  error: Error;
}

export interface Error {
  code: number;
  message: string;
  shortMessage?: string;
}

enum Errors {
  InvalidCredentials = 'Invalid credentials provided',
}

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor, OnDestroy {
  private readonly _notificationService: NotificationService;
  // Array of partial error messages that should be silenced in the UI.
  private readonly _silenceErrArr = [
    'external cluster functionality',
    'configs.config.gatekeeper.sh "config" not found',
  ];

  // Array of endpoints that should be silenced in the UI.
  private readonly _silencedEndpoints = [
    'providers/gke/validatecredentials',
    'presets?name=',
    `applicationdefinitions/${CLUSTER_AUTOSCALING_APP_DEF_NAME}`,
  ];

  // Error throttling properties
  private readonly _errorTrackingMap = new Map<string, ErrorTrackingEntry>();
  private readonly _throttlingConfig: ErrorThrottlingConfig = {...DEFAULT_THROTTLING_CONFIG};
  private _cleanupIntervalHandle?: number;

  private readonly _errorMap = new Map<string, string>([
    ['"AccessKeyId" is not valid', Errors.InvalidCredentials],
    ['InvalidAccessKeySecret', Errors.InvalidCredentials],
    ['Unauthorized', Errors.InvalidCredentials],
    ['validate the provided access credentials', Errors.InvalidCredentials],
    ['Unable to authenticate you', Errors.InvalidCredentials],
    ['Authentication failed', Errors.InvalidCredentials],
    ["couldn't get auth client", Errors.InvalidCredentials],
    ['Invalid authentication token', Errors.InvalidCredentials],
    ['Cannot complete login due to an incorrect user name or password', Errors.InvalidCredentials],
    ['Check to make sure you have the correct tenant ID', 'Invalid tenant ID provided'],
    ['Invalid client secret is provided', 'Invalid client secret provided'],
    ['The provided subscription identifier .* is malformed or invalid', 'Invalid subscription ID provided'],
    [
      'You may have sent your authentication request to the wrong tenant',
      'Invalid credentials provided or provided user credentials do not belong to this tenant',
    ],
    ['failed to list.*Resource group.*could not be found', 'Invalid resource group provided'],
    ['failed to retrieve temporary AWS credentials for assumed role', 'Invalid AssumeRole information provided'],
  ]);

  private adminSettings: AdminSettings;

  constructor(
    private readonly _inj: Injector,
    private readonly _settingsService: SettingsService,
  ) {
    this._notificationService = this._inj.get(NotificationService);
    this._settingsService = this._inj.get(SettingsService);

    // TODO: Fix this
    // Currently the way admin settings is being fetched is wrong and it needs to be revamped. We don't need a websocket or defaultings in FE.
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    this._settingsService.adminSettings.pipe(take(2)).subscribe(settings => {
      this.adminSettings = settings;
    });

    // Start periodic cleanup of error tracking map
    this._startCleanupInterval();
  }

  ngOnDestroy(): void {
    this._stopCleanupInterval();
    this._errorTrackingMap.clear();
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (httpError: HttpErrorResponse) => {
          this._handleHttpError(req, httpError);
        },
      }),
    );
  }

  private _handleHttpError(req: HttpRequest<any>, httpError: HttpErrorResponse): void {
    if (this._shouldSilenceRequest(req) || !httpError) {
      return;
    }

    let error = this._toError(httpError);
    if (this._shouldSilenceError(error)) {
      return;
    }

    const errorKey = this._generateErrorKey(req.url, httpError.status);
    if (!this._shouldShowThrottledError(errorKey, req.url, httpError.status, error.message)) {
      return;
    }

    error = this._mapError(error);
    this._notificationService.error(error.message, error.shortMessage);
  }

  private _mapError(error: Error): Error {
    const messageLower = error.message.toLowerCase();
    const matchingKey = Array.from(this._errorMap.keys()).find(
      key => messageLower.includes(key.toLowerCase()) || error.message.match(key),
    );

    if (matchingKey) {
      error.message = this._errorMap.get(matchingKey);
    }

    return error;
  }

  private _shouldSilenceError(error: Error): boolean {
    if (this.adminSettings.notifications?.hideErrors) {
      return true;
    }

    return this._silenceErrArr.some(partial => error.message.includes(partial));
  }

  private _shouldSilenceRequest(req: HttpRequest<any>): boolean {
    return this._silencedEndpoints.some(endpoint => req.url.includes(endpoint));
  }

  private _isAPIError(httpError: HttpErrorResponse): boolean {
    return !!httpError.error && !!httpError.error.error;
  }

  private _toError(httpError: HttpErrorResponse): Error {
    return this._isAPIError(httpError)
      ? {
          message: (httpError.error as APIError).error.message,
          code: (httpError.error as APIError).error.code,
        }
      : {
          message: httpError.message || httpError.statusText,
          code: httpError.status,
          shortMessage: httpError.statusText,
        };
  }

  private _generateErrorKey(url: string, status: number): string {
    const normalizedUrl = this._normalizeUrl(url);
    return `${normalizedUrl}|${status}`;
  }

  /**
   * Normalize URL - skip common API prefix and take meaningful segments
   *
   * Examples:
   *   /api/v2/projects/xxx/clusters/yyy/machinedeployments/md-name/nodes/metric
   *     → /machinedeployments/md-name/nodes/metric
   */
  private _normalizeUrl(url: string): string {
    try {
      const {pathname} = new URL(url, window.location.origin);
      const segments = pathname.split('/').filter(s => s.length > 0);

      // Skip /api/v1|v2/projects/<projectId> prefix if present
      const shouldSkipPrefix =
        segments.length > 4 &&
        segments[0] === 'api' &&
        (segments[1] === 'v1' || segments[1] === 'v2') &&
        segments[2] === 'projects';

      const meaningfulSegments = shouldSkipPrefix ? segments.slice(4) : segments;

      // Take last 3-4 segments (or all if less)
      const takeCount = Math.min(4, meaningfulSegments.length);
      const result = meaningfulSegments.slice(-takeCount);

      return result.length > 0 ? '/' + result.join('/') : '/';
    } catch {
      // Fallback for malformed URLs
      const parts = url
        .split('?')[0]
        .split('/')
        .filter(s => s.length > 0);
      if (parts.length === 0) return '/';

      const takeCount = Math.min(3, parts.length);
      return '/' + parts.slice(-takeCount).join('/');
    }
  }

  private _startCleanupInterval(): void {
    if (this._cleanupIntervalHandle) {
      return;
    }

    this._cleanupIntervalHandle = window.setInterval(() => {
      this._cleanupExpiredEntries();
    }, this._throttlingConfig.cleanupIntervalMs);
  }

  private _cleanupExpiredEntries(): void {
    const currentTimestampMs = Date.now();
    const expiredKeys: string[] = [];

    this._errorTrackingMap.forEach((entry, errorKey) => {
      const timeSinceLastOccurrence = currentTimestampMs - entry.lastOccurrenceTimestampMs;
      const isExpired = timeSinceLastOccurrence > this._throttlingConfig.entryExpirationMs;

      if (isExpired) {
        expiredKeys.push(errorKey);
      }
    });

    expiredKeys.forEach(key => this._errorTrackingMap.delete(key));
  }

  private _stopCleanupInterval(): void {
    if (this._cleanupIntervalHandle) {
      window.clearInterval(this._cleanupIntervalHandle);
      this._cleanupIntervalHandle = undefined;
    }
  }

  private _shouldShowThrottledError(
    errorKey: string,
    requestUrl: string,
    httpStatusCode: number,
    errorMessage: string,
  ): boolean {
    // Early exit: throttling disabled
    if (!this._throttlingConfig.enableThrottling) {
      return true;
    }

    const currentTimestampMs = Date.now();
    const entry = this._errorTrackingMap.get(errorKey);

    // Early exit: first occurrence - always show
    if (!entry) {
      this._createNewErrorEntry(errorKey, requestUrl, httpStatusCode, errorMessage, currentTimestampMs);
      return true;
    }

    this._updateErrorEntry(entry, requestUrl, httpStatusCode, errorMessage, currentTimestampMs);

    // Early exit: reset conditions met (time threshold or status changed)
    if (this._shouldResetError(entry, httpStatusCode, currentTimestampMs)) {
      this._resetErrorEntry(entry, currentTimestampMs);
      return true;
    }

    // Early exit: suppress if auto-muted
    if (entry.isAutoMuted) {
      return false;
    }

    // Early exit: suppress if not enough time passed
    const {nextNotificationTimestampMs, totalOccurrenceCount} = entry;
    const isStillThrottled = currentTimestampMs < nextNotificationTimestampMs;
    if (isStillThrottled) {
      return false;
    }

    return this._handleShowError(entry, errorKey, currentTimestampMs);
  }

  private _handleShowError(entry: ErrorTrackingEntry, errorKey: string, currentTimestampMs: number): boolean {
    entry.notificationsDisplayedCount++;

    // Check if should auto-mute after threshold
    if (this._shouldAutoMute(entry)) {
      this._muteError(entry, currentTimestampMs);
      return true; // Show last notification before muting
    }

    // Calculate next show time with exponential backoff
    this._updateNextShowTime(entry, currentTimestampMs);
    return true;
  }

  private _createNewErrorEntry(
    errorKey: string,
    failedUrl: string,
    httpStatusCode: number,
    errorMessage: string,
    timestampMs: number,
  ): void {
    this._errorTrackingMap.set(errorKey, {
      errorKey,
      totalOccurrenceCount: 1,
      notificationsDisplayedCount: 1,
      lastOccurrenceTimestampMs: timestampMs,
      nextNotificationTimestampMs: timestampMs + this._throttlingConfig.initialDelayMs,
      isAutoMuted: false,
      lastErrorMessage: errorMessage,
      lastHttpStatusCode: httpStatusCode,
      lastFailedUrl: failedUrl,
    });
  }

  private _updateErrorEntry(
    entry: ErrorTrackingEntry,
    failedUrl: string,
    httpStatusCode: number,
    errorMessage: string,
    timestampMs: number,
  ): void {
    entry.totalOccurrenceCount++;
    entry.lastOccurrenceTimestampMs = timestampMs;
    entry.lastErrorMessage = errorMessage;
    entry.lastHttpStatusCode = httpStatusCode;
    entry.lastFailedUrl = failedUrl;
  }

  private _shouldResetError(
    entry: ErrorTrackingEntry,
    currentHttpStatusCode: number,
    currentTimestampMs: number,
  ): boolean {
    const {isAutoMuted, autoMutedTimestampMs, lastHttpStatusCode} = entry;
    if (!isAutoMuted || !autoMutedTimestampMs) {
      return false;
    }

    const mutedDuration = currentTimestampMs - autoMutedTimestampMs;
    const {muteResetHours} = this._throttlingConfig;
    const resetThreshold = muteResetHours * MINUTES_PER_HOUR * MILLISECONDS_PER_MINUTE;
    const timeExceeded = mutedDuration >= resetThreshold;
    const statusChanged = lastHttpStatusCode !== currentHttpStatusCode;

    return timeExceeded || statusChanged;
  }

  private _resetErrorEntry(entry: ErrorTrackingEntry, timestamp: number): void {
    const {initialDelayMs} = this._throttlingConfig;
    entry.isAutoMuted = false;
    entry.autoMutedTimestampMs = undefined;
    entry.totalOccurrenceCount = 1;
    entry.notificationsDisplayedCount = 1;
    entry.nextNotificationTimestampMs = timestamp + initialDelayMs;
  }

  private _shouldAutoMute(entry: ErrorTrackingEntry): boolean {
    const {enableAutoMute, muteThreshold} = this._throttlingConfig;
    return enableAutoMute && entry.notificationsDisplayedCount >= muteThreshold;
  }

  private _muteError(entry: ErrorTrackingEntry, timestamp: number): void {
    entry.isAutoMuted = true;
    entry.autoMutedTimestampMs = timestamp;
  }

  private _updateNextShowTime(entry: ErrorTrackingEntry, currentTimestampMs: number): void {
    const {initialDelayMs, backoffMultiplier, maxDelayMs} = this._throttlingConfig;
    const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, entry.notificationsDisplayedCount - 1);
    const nextDelayMs = Math.min(exponentialDelay, maxDelayMs);
    entry.nextNotificationTimestampMs = currentTimestampMs + nextDelayMs;
  }
}
