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

import {Inject, Injectable} from '@angular/core';
import {Cookie, COOKIE_DI_TOKEN} from '@app/config';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {RandomString} from '@shared/functions/generate-random-string';
import {CookieService} from 'ngx-cookie-service';
import {Observable} from 'rxjs';
import {take, tap} from 'rxjs/operators';
import {PreviousRouteService} from '../previous-route';
import {TokenService} from '../token';
import {UserService} from '../user';
import {OIDCProviders} from '@app/shared/model/Config';

@Injectable()
export class Auth {
  private readonly _nonceLen = 32;
  private readonly _nonce = RandomString(this._nonceLen);
  private readonly _responseType = 'id_token';
  private readonly _clientId = 'kubermatic';
  private readonly _defaultScope = 'openid email profile groups';
  private readonly _redirectUri = window.location.protocol + '//' + window.location.host + '/projects';

  constructor(
    private readonly _cookieService: CookieService,
    private readonly _appConfigService: AppConfigService,
    private readonly _previousRouteService: PreviousRouteService,
    private readonly _userService: UserService,
    private readonly _tokenService: TokenService,
    @Inject(COOKIE_DI_TOKEN) private readonly _cookie: Cookie
  ) {
    const token = this._getTokenFromQuery();
    const nonce = this.getNonce();
    if (!!token && !!nonce) {
      if (this.compareNonceWithToken(token, nonce)) {
        // remove URL fragment with token, so that users can't accidentally copy&paste it and send it to others
        this._removeFragment();
        let secure = true;
        if (location.protocol === 'http:') {
          secure = false;
        }
        this._cookieService.set(this._cookie.token, token, 1, '/', null, secure, 'Lax');
        // localhost is only served via http, though secure cookie is not possible
        // following line will only work when domain is localhost
        this._cookieService.set(this._cookie.token, token, 1, '/', 'localhost', false, 'Lax');
        this._cookieService.set(this._cookie.token, token, 1, '/', '127.0.0.1', false, 'Lax');
      }
      this._previousRouteService.loadRouting();
    }
  }

  getOIDCProviderURL(): string {
    const config = this._appConfigService.getConfig();
    const baseUrl = config.oidc_provider_url ? config.oidc_provider_url : environment.oidcProviderUrl;
    const connectorId = config.oidc_connector_id ? config.oidc_connector_id : environment.oidcConnectorId;
    const scope = config.oidc_provider_scope ? config.oidc_provider_scope : this._defaultScope;
    const clientId = config.oidc_provider_client_id ? config.oidc_provider_client_id : this._clientId;

    let url =
      `${baseUrl}?response_type=${this._responseType}&client_id=${clientId}` +
      `&redirect_uri=${this._redirectUri}&scope=${scope}&nonce=${this._nonce}`;

    if (connectorId) {
      url += `&connector_id=${connectorId}`;
    }

    return url;
  }

  getBearerToken(): string {
    return this._cookieService.get(this._cookie.token);
  }

  getNonce(): string {
    return this._cookieService.get(this._cookie.nonce);
  }

  authenticated(): boolean {
    return this._tokenService.hasExpired();
  }

  getUsername(): string {
    if (this.getBearerToken()) {
      const tokenExp = this._tokenService.decodeToken(this.getBearerToken());
      return tokenExp.name;
    }

    return '';
  }

  compareNonceWithToken(token: string, nonce: string): boolean {
    if (!!token && !!nonce) {
      const decodedToken = this._tokenService.decodeToken(token);
      if (decodedToken) {
        return nonce === decodedToken.nonce;
      }
    }
    return false;
  }

  login(): void {
    this._cookieService.set(this._cookie.autoredirect, 'true', 1, '/', null, false, 'Strict');
  }

  logout(): Observable<boolean> {
    return this._userService
      .logout()
      .pipe(
        tap(_ => {
          this._cookieService.delete(this._cookie.token, '/');
          this._cookieService.delete(this._cookie.nonce, '/');
        })
      )
      .pipe(take(1));
  }

  oidcProviderLogout(token: string): void {
    const config = this._appConfigService.getConfig();
    if (config.oidc_logout_url) {
      const logoutUrl = new URL(config.oidc_logout_url);
      switch (config.oidc_provider?.toLowerCase()) {
        case OIDCProviders.Keycloak:
          logoutUrl.searchParams.set('post_logout_redirect_uri', this._redirectUri);
          logoutUrl.searchParams.set('id_token_hint', token);
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

  setNonce(): void {
    const nonceRegExp = /[?&#]nonce=([^&]+)/;
    const nonceStr = nonceRegExp.exec(this.getOIDCProviderURL());
    const minLen = 2;
    if (!!nonceStr && nonceStr.length >= minLen && !!nonceStr[1]) {
      let secure = true;
      if (location.protocol === 'http:') {
        secure = false;
      }
      this._cookieService.set(this._cookie.nonce, nonceStr[1], null, '/', null, secure, 'Lax');
      // localhost is only served via http, though secure cookie is not possible
      // following line will only work when domain is localhost
      this._cookieService.set(this._cookie.nonce, nonceStr[1], null, '/', 'localhost', false, 'Lax');
      this._cookieService.set(this._cookie.nonce, nonceStr[1], null, '/', '127.0.0.1', false, 'Lax');
    }
  }

  private _getTokenFromQuery(): string {
    const results = new RegExp('[?&#]id_token=([^&#]*)').exec(window.location.href);
    return results === null ? null : results[1] || '';
  }

  private _removeFragment(): void {
    const currentHref = window.location.href;
    history.replaceState({}, '', currentHref.slice(0, currentHref.indexOf('#')));
  }
}
