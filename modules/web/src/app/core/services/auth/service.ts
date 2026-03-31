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
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {CookieService} from 'ngx-cookie-service';
import {Observable, of, Subscription, timer} from 'rxjs';
import {map, take, catchError, switchMap} from 'rxjs/operators';
import {OIDCProviders} from '@app/shared/model/Config';

interface AuthStatusResponse {
  expires_at: number;
}

export const AUTOREDIRECT_COOKIE = 'autoredirect';

@Injectable()
export class Auth {
  private readonly _redirectUri = window.location.protocol + '//' + window.location.host + '/projects';
  private readonly _statusUrl = `${environment.newRestRoot}/auth/status`;
  private readonly _refreshUrl = `${environment.newRestRoot}/auth/refresh`;
  private readonly _logoutUrl = `${environment.newRestRoot}/auth/logout`;
  private readonly _refreshBufferMs = 60 * 1000; // refresh 1 minute before expiry
  private _expiresAt: number = 0;
  private _refreshSub: Subscription = null;

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _cookieService: CookieService,
    private readonly _appConfigService: AppConfigService
  ) {}

  init(): Promise<void> {
    return this.checkStatus();
  }

  checkStatus(): Promise<void> {
    return new Promise<void>(resolve => {
      this._httpClient.get<AuthStatusResponse>(this._statusUrl).pipe(
        catchError(() => {
          this._expiresAt = 0;
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          this._expiresAt = response.expires_at;
          this._scheduleRefresh();
        }
        resolve();
      });
    });
  }

  authenticated(): boolean {
    if (this._expiresAt === 0) {
      return false;
    }
    return Date.now() < this._expiresAt * 1000;
  }

  get expiresAt(): number {
    return this._expiresAt;
  }

  login(): void {
    this._cookieService.set(AUTOREDIRECT_COOKIE, 'true', 1, '/', null, false, 'Strict');
  }

  logout(): Observable<boolean> {
    this._cancelRefresh();
    return this._httpClient.post(this._logoutUrl, null).pipe(
      map(() => {
        this._expiresAt = 0;
        return true;
      }),
      take(1)
    );
  }

  oidcProviderLogout(token: string): void {
    const config = this._appConfigService.getConfig();
    if (config.oidc_logout_url) {
      const logoutUrl = new URL(config.oidc_logout_url);
      switch (config.oidc_provider?.toLowerCase()) {
        case OIDCProviders.Keycloak:
          logoutUrl.searchParams.set('post_logout_redirect_uri', this._redirectUri);
          if (token) {
            logoutUrl.searchParams.set('id_token_hint', token);
          }
          break;
        default:
          if (logoutUrl.searchParams.has('redirectUri')) {
            logoutUrl.searchParams.set('redirectUri', this._redirectUri);
          } else {
            logoutUrl.searchParams.set('redirect_uri', this._redirectUri);
          }
          break;
      }
      window.location.href = logoutUrl.toString();
    }
  }

  private _scheduleRefresh(): void {
    this._cancelRefresh();
    const msUntilExpiry = this._expiresAt * 1000 - Date.now();
    const msUntilRefresh = msUntilExpiry - this._refreshBufferMs;

    if (msUntilRefresh <= 0) {
      return;
    }

    this._refreshSub = timer(msUntilRefresh).pipe(
      switchMap(() => this._httpClient.post(this._refreshUrl, null)),
      catchError(() => {
        this._expiresAt = 0;
        window.location.href = '/';
        return of(null);
      })
    ).subscribe(response => {
      if (response !== null) {
        this.checkStatus();
      }
    });
  }

  private _cancelRefresh(): void {
    if (this._refreshSub) {
      this._refreshSub.unsubscribe();
      this._refreshSub = null;
    }
  }
}
