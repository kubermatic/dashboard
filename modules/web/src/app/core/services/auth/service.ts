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
import {Inject, Injectable} from '@angular/core';
import {Cookie, COOKIE_DI_TOKEN} from '@app/config';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {CookieService} from 'ngx-cookie-service';
import {Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {TokenService} from '../token';
import {OIDCProviders} from '@app/shared/model/Config';

@Injectable()
export class Auth {
  private readonly _redirectUri = window.location.protocol + '//' + window.location.host + '/projects';
  private readonly _logoutUrl = `${environment.newRestRoot}/auth/logout`;

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _cookieService: CookieService,
    private readonly _appConfigService: AppConfigService,
    private readonly _tokenService: TokenService,
    @Inject(COOKIE_DI_TOKEN) private readonly _cookie: Cookie
  ) {}

  authenticated(): boolean {
    return this._tokenService.hasExpired();
  }

  getUsername(): string {
    if (this._cookieService.get(this._cookie.token)) {
      const tokenExp = this._tokenService.decodeToken(this._cookieService.get(this._cookie.token));
      return tokenExp.name;
    }

    return '';
  }

  login(): void {
    this._cookieService.set(this._cookie.autoredirect, 'true', 1, '/', null, false, 'Strict');
  }

  logout(): Observable<boolean> {
    return this._httpClient.post(this._logoutUrl, null).pipe(
      map(() => true),
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
}
