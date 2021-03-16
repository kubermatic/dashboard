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

import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {NotificationService} from '@core/services/notification/service';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor {
  private readonly _notificationService: NotificationService;
  // Array of partial error messages that should be silenced in the UI.
  private readonly _silenceErrArr = [
    'external cluster functionality',
    'configs.config.gatekeeper.sh "config" not found',
  ];

  constructor(private readonly _inj: Injector) {
    this._notificationService = this._inj.get(NotificationService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(
        () => {},
        errorInstance => {
          if (!errorInstance) {
            return;
          }

          if (this._shouldSilenceError(errorInstance)) {
            return;
          }

          let errorMsg = '';

          if (errorInstance.status) {
            errorMsg += `Error ${errorInstance.status} `;
          }

          errorMsg += errorInstance.error.error.message || errorInstance.message || errorInstance.statusText;
          this._notificationService.error(errorMsg);
        }
      )
    );
  }

  private _isAPIError(instance: any): boolean {
    return !!instance.error && !!instance.error.error;
  }

  private _shouldSilenceError(instance: any): boolean {
    return (
      (this._isAPIError(instance) &&
        this._silenceErrArr.some(partial => instance.error.error.message.includes(partial))) ||
      this._silenceErrArr.some(partial => instance.message.includes(partial))
    );
  }
}
