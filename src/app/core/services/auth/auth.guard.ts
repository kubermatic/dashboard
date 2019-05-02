import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {Auth} from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: Auth) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.authenticated()) {
      return true;
    } else {
      window.location.href = this.auth.getOIDCProviderURL();
      return false;
    }
  }
}
