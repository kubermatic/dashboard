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

import {HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Observable, throwError, BehaviorSubject} from 'rxjs';
import {catchError, filter, switchMap, take} from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly _refreshUrl = `${environment.newRestRoot}/auth/refresh`;
  private _isRefreshing = false;
  private _refreshDone$ = new BehaviorSubject<boolean>(false);

  constructor(private readonly _http: HttpClient) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only handle 401s for API requests, and don't retry the refresh call itself.
        if (error.status === 401 && !req.url.startsWith(this._refreshUrl)) {
          return this._handle401(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private _handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this._isRefreshing) {
      // Another request already triggered a refresh — wait for it to complete, then retry.
      return this._refreshDone$.pipe(
        filter(done => done),
        take(1),
        switchMap(() => next.handle(req))
      );
    }

    this._isRefreshing = true;
    this._refreshDone$.next(false);

    return this._http.post(this._refreshUrl, null).pipe(
      switchMap(() => {
        this._isRefreshing = false;
        this._refreshDone$.next(true);
        // Retry the original request — browser will send the new cookie.
        return next.handle(req);
      }),
      catchError((refreshError) => {
        this._isRefreshing = false;
        this._refreshDone$.next(true);
        // Refresh failed — redirect to login page.
        // window.location.href = '/';
        return throwError(() => refreshError);
      })
    );
  }
}
