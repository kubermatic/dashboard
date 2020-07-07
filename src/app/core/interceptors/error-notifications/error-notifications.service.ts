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
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {NotificationService} from '../../services';

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor {
  private readonly _notificationService: NotificationService;
  // Array of partial error messages that should be silenced in the UI.
  private readonly _silenceErrArr = [];

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

          if (!!errorInstance.error && !!errorInstance.error.error) {
            this._notificationService.error(
              `Error ${errorInstance.status}: ${
                errorInstance.error.error.message || errorInstance.message || errorInstance.statusText
              }`
            );
          } else if (
            errorInstance.message &&
            this._silenceErrArr.every(partial => !errorInstance.message.includes(partial))
          ) {
            this._notificationService.error(`${errorInstance.message}`);
          }
        }
      )
    );
  }
}
