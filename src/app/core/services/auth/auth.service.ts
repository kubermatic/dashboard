import {Injectable} from '@angular/core';
import * as moment from 'moment';
import {CookieService} from 'ngx-cookie-service';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';

@Injectable()
export class Auth {
  constructor(private readonly _cookieService: CookieService, private readonly _appConfigService: AppConfigService) {
    const token = this.getTokenFromQuery();
    const nonce = this.getNonce();
    if (!!token && !!nonce) {
      if (this.compareNonceWithToken(token, nonce)) {
        // remove URL fragment with token, so that users can't accidentally copy&paste it and send it to others
        this.removeFragment();
        this._cookieService.set('token', token, 1, null, null, true);
        // localhost is only served via http, though secure cookie is not possible
        // following line will only work when domain is localhost
        this._cookieService.set('token', token, 1, null, 'localhost');
        this._cookieService.set('token', token, 1, null, '127.0.0.1');
      }
    }
  }

  getOIDCProviderURL(): string {
    return this._appConfigService.getConfig().oidc_provider_url ? this._appConfigService.getConfig().oidc_provider_url :
                                                                  environment.oidcProviderUrl;
  }

  getBearerToken(): string {
    return this._cookieService.get('token');
  }

  getNonce(): string {
    return this._cookieService.get('nonce');
  }

  authenticated(): boolean {
    // Check if there's an unexpired JWT
    // This searches for an item in cookies with key == 'token'
    if (!!this.getBearerToken()) {
      const tokenExp = this.decodeToken(this.getBearerToken());
      return moment().isBefore(moment(tokenExp.exp * 1000));
    } else {
      return false;
    }
  }

  getUsername(): string {
    if (!!this.getBearerToken()) {
      const tokenExp = this.decodeToken(this.getBearerToken());
      return tokenExp.name;
    }
    return '';
  }

  compareNonceWithToken(token: string, nonce: string): boolean {
    if (!!token && !!nonce) {
      const decodedToken = this.decodeToken(token);
      if (!!decodedToken) {
        return (nonce === decodedToken.nonce);
      }
    }
    return false;
  }

  logout(): void {
    this._cookieService.delete('token');
    this._cookieService.delete('nonce');
  }

  private getTokenFromQuery(): string {
    const results = new RegExp('[\?&]id_token=([^&#]*)').exec(window.location.href);
    return results == null ? null : results[1] || '';
  }

  private removeFragment(): void {
    const currentHref = window.location.href;
    history.replaceState({}, '', currentHref.slice(0, currentHref.indexOf('#')));
  }

  // Helper Functions for decoding JWT token:
  decodeToken(token: string): any {
    if (!!token) {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('JWT must have 3 parts');
      }
      const decoded = this.urlBase64Decode(parts[1]);
      if (!decoded) {
        throw new Error('Cannot decode the token');
      }
      return JSON.parse(decoded);
    }
  }

  private urlBase64Decode(str: string): string {
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
      default: { throw new Error('Illegal base64url string!'); }
    }
    return decodeURIComponent(window.atob(output));
  }
}
