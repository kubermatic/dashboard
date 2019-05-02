import {Injectable} from '@angular/core';

@Injectable()
export class AuthMockService {
  isAuth = true;

  getOIDCProviderURL(): string {
    return '';
  }

  authenticated(): boolean {
    return this.isAuth;
  }

  getBearerToken(): string {
    return 'token';
  }

  getUsername(): string {
    return 'testUser';
  }

  logout(): void {}
}
