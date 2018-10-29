import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from './auth.service';

export function authFactory(): Auth {
  return new Auth();
}

export const AUTH_PROVIDERS = {
  provide: Auth,
  deps: [HttpClient, HttpParams],
  useFactory: authFactory
};
