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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {CookieService} from 'ngx-cookie-service';
import {Observable, of, Subscription, timer} from 'rxjs';
import {catchError} from 'rxjs/operators';

interface AuthStatusResponse {
  expires_at: number;
}

const SECONDS_TO_MS = 1000;
const REFRESH_BUFFER_SECONDS = 60;

interface LogoutResponse {
  redirect: string;
}

@Injectable()
export class Auth {
  private readonly _statusUrl = `${environment.newRestRoot}/auth/status`;
  private readonly _refreshUrl = `${environment.newRestRoot}/auth/refresh`;
  private readonly _logoutUrl = `${environment.newRestRoot}/auth/logout`;
  private readonly _refreshBufferMs = REFRESH_BUFFER_SECONDS * SECONDS_TO_MS;
  private _expiresAt: number = 0;
  private _refreshSub: Subscription = null;

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _cookieService: CookieService
  ) {}

  init(): Promise<void> {
    return this.checkStatus();
  }

  checkStatus(): Promise<void> {
    return new Promise<void>(resolve => {
      this._httpClient
        .get<AuthStatusResponse>(this._statusUrl)
        .pipe(catchError(() => of(null)))
        .subscribe(response => {
          this._expiresAt = response?.expires_at ?? 0;
          const msUntilExpiry = this._expiresAt * SECONDS_TO_MS - Date.now();
          if (msUntilExpiry <= this._refreshBufferMs) {
            this._refreshToken(resolve);
            return;
          }
          this._scheduleRefresh();
          resolve();
        });
    });
  }

  authenticated(): boolean {
    if (this._expiresAt > 0 && Date.now() < this._expiresAt * SECONDS_TO_MS) {
      return true;
    }
    // Fallback: check if token cookie is readable (non-HttpOnly environments like e2e tests).
    // In production the cookie is HttpOnly so this returns false, relying on the status endpoint.
    return !!this._cookieService.get('token');
  }

  logout(): Observable<LogoutResponse> {
    this._cancelRefresh();
    return this._httpClient.post<LogoutResponse>(this._logoutUrl, null).pipe(catchError(() => of(null)));
  }

  private _scheduleRefresh(): void {
    this._cancelRefresh();
    const msUntilExpiry = this._expiresAt * SECONDS_TO_MS - Date.now();
    const msUntilRefresh = msUntilExpiry - this._refreshBufferMs;

    if (msUntilRefresh <= 0) {
      return;
    }

    this._refreshSub = timer(msUntilRefresh).subscribe(() => this._refreshToken());
  }

  private _cancelRefresh(): void {
    if (this._refreshSub) {
      this._refreshSub.unsubscribe();
      this._refreshSub = null;
    }
  }

  private _refreshToken(onComplete?: () => void): void {
    this._httpClient.post<AuthStatusResponse>(this._refreshUrl, null).subscribe({
      next: res => {
        this._expiresAt = res.expires_at;
        this._scheduleRefresh();
        onComplete?.();
      },
      error: () => {
        this._expiresAt = 0;
        onComplete?.();
      },
    });
  }
}
