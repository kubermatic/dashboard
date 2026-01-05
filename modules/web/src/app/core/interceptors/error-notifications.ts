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
import {AppConfigService} from '@app/config.service';
import {
  ErrorEntry,
  ErrorThrottlingConfig,
  MILLISECONDS_PER_HOUR,
  MILLISECONDS_PER_MINUTE,
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
  private readonly _maxMapSize = 100;
  private readonly _errorTrackingMap = new Map<string, ErrorEntry>();
  private _throttlingConfigCache: ErrorThrottlingConfig | null = null;

  private get _throttlingConfig(): ErrorThrottlingConfig {
    if (!this._throttlingConfigCache) {
      const config = this._appConfigService.getConfig().error_throttling;
      this._throttlingConfigCache = {
        initialDelayMs: config.initial_delay_minutes * MILLISECONDS_PER_MINUTE,
        maxDelayMs: config.max_delay_minutes * MILLISECONDS_PER_MINUTE,
        backoffMultiplier: config.backoff_multiplier,
        cleanupIntervalMs: config.cleanup_interval_minutes * MILLISECONDS_PER_MINUTE,
        entryExpirationMs: config.entry_expiration_hours * MILLISECONDS_PER_HOUR,
        enableThrottling: config.enable_throttling,
      };
    }
    return this._throttlingConfigCache;
  }

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
    private readonly _appConfigService: AppConfigService
  ) {
    this._notificationService = this._inj.get(NotificationService);
    this._settingsService = this._inj.get(SettingsService);

    // TODO: Fix this
    // Currently the way admin settings is being fetched is wrong and it needs to be revamped. We don't need a websocket or defaultings in FE.
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    this._settingsService.adminSettings.pipe(take(2)).subscribe(settings => {
      this.adminSettings = settings;
    });
  }

  ngOnDestroy(): void {
    this._errorTrackingMap.clear();
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (httpError: HttpErrorResponse) => {
          this._handleHttpError(req, httpError);
        },
      })
    );
  }

  //  Error Handling
  private _handleHttpError(req: HttpRequest<any>, httpError: HttpErrorResponse): void {
    if (this._shouldSilenceRequest(req) || !httpError) {
      return;
    }

    let error = this._convertToError(httpError);
    if (this._shouldSilenceError(error)) {
      return;
    }

    const errorKey = this._buildErrorKey(req.url, httpError.status);
    if (this._shouldHideNotification(errorKey, req.url, httpError.status, error.message)) {
      return;
    }

    error = this._mapError(error);
    this._notificationService.error(error.message, error.shortMessage);
  }

  private _mapError(error: Error): Error {
    for (const key of this._errorMap.keys()) {
      if (error.message.toLocaleLowerCase().includes(key.toLocaleLowerCase()) || error.message.match(key)) {
        error.message = this._errorMap.get(key);
        break;
      }
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

  private _convertToError(httpError: HttpErrorResponse): Error {
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

  private _isAPIError(httpError: HttpErrorResponse): boolean {
    return !!httpError.error && !!httpError.error.error;
  }

  private _buildErrorKey(url: string, status: number): string {
    const normalizedUrl = this._normalizeUrl(url);
    return `${normalizedUrl}|${status}`;
  }

  /**
   * Normalize URL - remove API version prefix and query parameters
   *
   * Examples:
   *   /api/v2/projects/xxx/clusters/yyy/machinedeployments/md-name/nodes/metric
   *     → /projects/xxx/clusters/yyy/machinedeployments/md-name/nodes/metric
   */
  private _normalizeUrl(url: string): string {
    try {
      const {pathname} = new URL(url, window.location.origin);
      // Remove /api/v1 or /api/v2 prefix if present
      return pathname.replace(/^\/api\/v\d+\//, '/');
    } catch {
      // Fallback: strip query params manually if URL parsing fails
      return url.split('?')[0];
    }
  }

  private _shouldHideNotification(
    errorKey: string,
    requestUrl: string,
    httpStatusCode: number,
    errorMessage: string
  ): boolean {
    // Throttling disabled
    if (!this._throttlingConfig.enableThrottling) {
      return false;
    }

    const currentTimestampMs = Date.now();
    const entry = this._errorTrackingMap.get(errorKey);

    // First occurrence
    if (!entry) {
      if (this._errorTrackingMap.size >= this._maxMapSize) {
        this._cleanupExpiredEntries();
      }
      this._createErrorEntry(errorKey, requestUrl, httpStatusCode, errorMessage, currentTimestampMs);
      return false;
    }

    this._updateExistingEntry(entry, requestUrl, httpStatusCode, errorMessage, currentTimestampMs);

    if (this._hasStatusCodeChanged(entry, httpStatusCode)) {
      this._resetEntryThrottle(entry, currentTimestampMs);
      return false;
    }

    // Still throttled
    const isStillThrottled = currentTimestampMs < entry.nextNotificationTimestampMs;
    if (isStillThrottled) {
      return true;
    }

    // Show notification and calculate next time
    this._processNotificationDisplay(entry, currentTimestampMs);
    return false;
  }

  private _processNotificationDisplay(entry: ErrorEntry, currentTimestampMs: number): void {
    entry.notificationsDisplayedCount++;
    this._calculateNextNotificationTime(entry, currentTimestampMs);
  }

  private _calculateNextNotificationTime(entry: ErrorEntry, currentTimestampMs: number): void {
    const {initialDelayMs, backoffMultiplier, maxDelayMs} = this._throttlingConfig;
    const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, entry.notificationsDisplayedCount - 1);
    const nextDelayMs = Math.min(exponentialDelay, maxDelayMs);
    entry.nextNotificationTimestampMs = currentTimestampMs + nextDelayMs;
  }

  // Error Entry (Create/Update)

  private _createErrorEntry(
    errorKey: string,
    failedUrl: string,
    httpStatusCode: number,
    errorMessage: string,
    timestampMs: number
  ): void {
    this._errorTrackingMap.set(errorKey, {
      errorKey,
      notificationsDisplayedCount: 1,
      lastOccurrenceTimestampMs: timestampMs,
      nextNotificationTimestampMs: timestampMs + this._throttlingConfig.initialDelayMs,
      lastErrorMessage: errorMessage,
      lastHttpStatusCode: httpStatusCode,
      lastFailedUrl: failedUrl,
    });
  }

  private _updateExistingEntry(
    entry: ErrorEntry,
    failedUrl: string,
    httpStatusCode: number,
    errorMessage: string,
    timestampMs: number
  ): void {
    entry.lastOccurrenceTimestampMs = timestampMs;
    entry.lastErrorMessage = errorMessage;
    entry.lastHttpStatusCode = httpStatusCode;
    entry.lastFailedUrl = failedUrl;
  }

  private _hasStatusCodeChanged(entry: ErrorEntry, currentHttpStatusCode: number): boolean {
    return entry.lastHttpStatusCode !== currentHttpStatusCode;
  }

  private _resetEntryThrottle(entry: ErrorEntry, currentTimestampMs: number): void {
    entry.notificationsDisplayedCount = 1;
    entry.nextNotificationTimestampMs = currentTimestampMs + this._throttlingConfig.initialDelayMs;
  }

  private _cleanupExpiredEntries(): void {
    const currentTimestampMs = Date.now();

    this._errorTrackingMap.forEach((entry, errorKey) => {
      const timeSinceLastOccurrence = currentTimestampMs - entry.lastOccurrenceTimestampMs;
      const isExpired = timeSinceLastOccurrence > this._throttlingConfig.entryExpirationMs;

      if (isExpired) {
        this._errorTrackingMap.delete(errorKey);
      }
    });
  }
}
