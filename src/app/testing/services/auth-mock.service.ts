import { Injectable } from '@angular/core';

@Injectable()
export class AuthMockService {
  public isAuth = true;

  public authenticated(): boolean {
    return this.isAuth;
  }

  public getBearerToken(): string {
    return 'token';
  }

  public getUsername(): string {
    return 'testUser';
  }

  public logout() {}

}
