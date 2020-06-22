import {Inject, Injectable} from '@angular/core';
import * as moment from 'moment';
import {CookieService} from 'ngx-cookie-service';
import {Cookie, COOKIE_DI_TOKEN} from '../../../app.config';

@Injectable()
export class TokenService {
  constructor(
    private readonly _cookieService: CookieService,
    @Inject(COOKIE_DI_TOKEN) private readonly _cookie: Cookie
  ) {}

  hasExpired(): boolean {
    const token = this._cookieService.get(this._cookie.token);
    if (token) {
      const tokenExp = this.decodeToken(token);
      return moment().isBefore(moment(tokenExp.exp * 1000));
    }
    return false;
  }

  decodeToken(token: string): any {
    if (token) {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('JWT must have 3 parts');
      }
      const decoded = this._urlBase64Decode(parts[1]);
      if (!decoded) {
        throw new Error('Cannot decode the token');
      }
      return JSON.parse(decoded);
    }
  }

  private _urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: {
        break;
      }
      case 2: {
        output += '==';
        break;
      }
      case 3: {
        output += '=';
        break;
      }
      default: {
        throw new Error('Illegal base64url string!');
      }
    }
    return decodeURIComponent(window.atob(output));
  }
}
