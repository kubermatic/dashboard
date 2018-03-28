import { AuthConfig, AuthHttp } from 'angular2-jwt';
import { Http, RequestOptions } from '@angular/http';

export function authFactory(http: Http, options: RequestOptions) {
  return new AuthHttp(new AuthConfig({
    // Config options if you want
  }), http, options);
}

// Include this in your ngModule providers
export const AUTH_PROVIDERS = {
  provide: AuthHttp,
  deps: [Http, RequestOptions],
  useFactory: authFactory
};
