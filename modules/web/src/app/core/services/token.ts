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
  private _token: string;

  constructor(
    private readonly _cookieService: CookieService,
    @Inject(COOKIE_DI_TOKEN) private readonly _cookie: Cookie
  ) {}

  set token(token: string) {
    this._token = token;
  }

  get token(): string {
    return this._token;
  }

  hasExpired(): boolean {
    const token = this._cookieService.get(this._cookie.token) || this._token;
    return token ? moment().isBefore(moment(this.decodeToken(token).exp * this._baseTime)) : false;
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
}
