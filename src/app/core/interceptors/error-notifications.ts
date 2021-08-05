// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {NotificationService} from '@core/services/notification';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

export interface APIError {
  error: Error;
}

export interface Error {
  code: number;
  message: string;
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

  private readonly _errorMap = new Map<string, string>([
    ['"AccessKeyId" is not valid', Errors.InvalidCredentials],
    ['InvalidAccessKeySecret', Errors.InvalidCredentials],
    ['Unauthorized', Errors.InvalidCredentials],
    ['validate the provided access credentials', Errors.InvalidCredentials],
  ]);

  constructor(private readonly _inj: Injector) {
    this._notificationService = this._inj.get(NotificationService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap({
        next: () => {},
        error: (httpError: HttpErrorResponse) => {
          if (!httpError) {
            return;
          }

          let error = this._toError(httpError);
          if (this._shouldSilenceError(error)) {
            return;
          }

          error = this._mapError(error);
          this._notificationService.error(error.message);
        },
      })
    );
  }

  private _mapError(error: Error): Error {
    for (const key of this._errorMap.keys()) {
      if (error.message.toLocaleLowerCase().includes(key.toLocaleLowerCase())) {
        error.message = this._errorMap.get(key);
        break;
      }
    }

    return error;
  }

  private _shouldSilenceError(error: Error): boolean {
    return this._silenceErrArr.some(partial => error.message.includes(partial));
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
        };
  }
}
