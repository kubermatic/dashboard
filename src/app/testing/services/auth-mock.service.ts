import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';

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

  logout(): Observable<boolean> {
    return of(true);
  }

  setNonce(): void {}
}
