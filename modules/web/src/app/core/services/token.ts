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
import moment from 'moment';
import {CookieService} from 'ngx-cookie-service';
import {Cookie, COOKIE_DI_TOKEN} from '@app/config';

@Injectable()
export class TokenService {
  private readonly _baseTime = 1000;
  private readonly _maxCookieSize = 4000;
  private _token: string;

  constructor(
    private readonly _cookieService: CookieService,
    @Inject(COOKIE_DI_TOKEN) private readonly _cookie: Cookie
  ) {}

  set token(token: string) {
    this._token = token;
    this.setTokenCookies(token);
  }

  get token(): string {
    return this._token || this.getToken();
  }

  hasExpired(): boolean {
    const token = this.token;
    return token ? moment().isBefore(moment(this.decodeToken(token).exp * this._baseTime)) : false;
  }

  setTokenCookies(token: string): void {
    const numOfCookies = Math.ceil(token.length / this._maxCookieSize);
    if (numOfCookies > 1) {
      for (let i = 0; i < numOfCookies; i++) {
        const tokenPart = token.slice(i * this._maxCookieSize, (i + 1) * this._maxCookieSize);
        const cookieName = `${this._cookie.tokenPrefix}${i + 1}`;
        this._setTokenCookie(cookieName, tokenPart);
      }
    } else {
      this._setTokenCookie(this._cookie.token, token);
    }
  }

  getToken(): string {
    if (this._cookieService.check(this._cookie.token)) {
      return this._cookieService.get(this._cookie.token);
    }
    let token = '';
    let count = 1;
    let tokenPart = this._cookieService.get(`${this._cookie.tokenPrefix}-${count}`);
    while (tokenPart) {
      token += tokenPart;
      count++;
      tokenPart = this._cookieService.get(`${this._cookie.tokenPrefix}-${count}`);
    }
    return token;
  }

  deleteToken(): void {
    if (this._cookieService.check(this._cookie.token)) {
      this._cookieService.delete(this._cookie.token);
      return;
    }
    let count = 1;
    let tokenPart = this._cookieService.get(`${this._cookie.tokenPrefix}${count}`);
    while (tokenPart) {
      this._cookieService.delete(`${this._cookie.tokenPrefix}${count}`, '/');
      count++;
      tokenPart = this._cookieService.get(`${this._cookie.tokenPrefix}${count}`);
    }
    this._token = '';
  }

  decodeToken(token: string): any {
    if (token) {
      const parts = token.split('.');
      const expectedParts = 3;
      if (parts.length !== expectedParts) {
        throw new Error('JWT must have 3 parts');
      }
      const decoded = this._urlBase64Decode(parts[1]);
      if (!decoded) {
        throw new Error('Cannot decode the token');
      }
      return JSON.parse(decoded);
    }
  }

  /* eslint-disable @typescript-eslint/no-magic-numbers */
  private _urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw new Error('Illegal base64url string!');
    }
    return decodeURIComponent(window.atob(output));
  }

  // private _setSubToken(token: string, count: number, secure: boolean): void {

  //   this._cookieService.set(`${this._cookie.tokenPrefix}-${count}`, token, 1, '/', null, secure, 'Lax');
  //   // localhost is only served via http, though secure cookie is not possible
  //   // following line will only work when domain is localhost
  //   this._cookieService.set(`${this._cookie.tokenPrefix}-${count}`, token, 1, '/', 'localhost', false, 'Lax');
  //   this._cookieService.set(`${this._cookie.tokenPrefix}-${count}`, token, 1, '/', '127.0.0.1', false, 'Lax');
  // }

  private _setTokenCookie(cookieName: string, token: string) {
    let secure = true;
    if (location.protocol === 'http:') {
      secure = false;
    }
    this._cookieService.set(cookieName, token, 1, '/', null, secure, 'Lax');
    // localhost is only served via http, though secure cookie is not possible
    // following line will only work when domain is localhost
    this._cookieService.set(cookieName, token, 1, '/', 'localhost', false, 'Lax');
    this._cookieService.set(cookieName, token, 1, '/', '127.0.0.1', false, 'Lax');
  }
}
