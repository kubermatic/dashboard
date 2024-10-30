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

import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {NotificationService} from '@core/services/notification';
import {Observable} from 'rxjs';
import {take, tap} from 'rxjs/operators';
import {SettingsService} from '@core/services/settings';
import {AdminSettings} from '@shared/entity/settings';

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
export class ErrorNotificationsInterceptor implements HttpInterceptor {
  private readonly _notificationService: NotificationService;
  // Array of partial error messages that should be silenced in the UI.
  private readonly _silenceErrArr = [
    'external cluster functionality',
    'configs.config.gatekeeper.sh "config" not found',
  ];

  // Array of endpoints that should be silenced in the UI.
  private readonly _silencedEndpoints = ['providers/gke/validatecredentials'];

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
    private readonly _settingsService: SettingsService
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

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (httpError: HttpErrorResponse) => {
          if (this._shouldSilenceRequest(req)) {
            return;
          }

          if (!httpError) {
            return;
          }

          let error = this._toError(httpError);
          if (this._shouldSilenceError(error)) {
            return;
          }

          error = this._mapError(error);
          this._notificationService.error(error.message, error.shortMessage);
        },
      })
    );
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
}
