import {Injectable} from '@angular/core';

@Injectable()
export class AuthMockService {
  isAuth = true;

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
