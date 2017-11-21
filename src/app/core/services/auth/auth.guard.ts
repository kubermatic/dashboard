import {Injectable} from "@angular/core";
import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from "@angular/router";
import {CanActivate} from "@angular/router";
import {Auth} from "./auth.service";
import {environment} from "../../../../environments/environment";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.auth.authenticated()) {
      return true;
    } else {
      window.location.href = environment.coreOSdexAuth;
      return false;
    }
  }
}
