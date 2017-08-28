import {Injectable} from "@angular/core";
import {Router, NavigationStart} from "@angular/router";
import {tokenNotExpired} from "angular2-jwt";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Actions} from "../reducers/actions";

@Injectable()
export class Auth {
  constructor(private router: Router, private store: Store<fromRoot.State>) {
    if (this.authenticated()) {
      const idToken = this.getBearerToken();
      const profile = JSON.parse(localStorage.getItem("profile"));
      this.store.dispatch({ type: Actions.LOGGED_IN, payload: { token: idToken, profile: profile } });
    } else {
      this.login();
    }
    
    this.handleAuthenticationWithHash();
  }

  public getBearerToken(): string {
    return localStorage.getItem("token");
  }

  private handleAuthenticationWithHash(): void {
    this.router.events
      .filter(event => event instanceof NavigationStart)
      .filter((event: NavigationStart) => (/access_token|token|error/).test(event.url));
  }


  public login() {
    let accessToken : any;
    let expiresIn : any;
    let token : string;
    let tokenType : any;

    let params = function(name){
      var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
      if (results==null){
        return null;
      } else {
        return results[1] || '';
      }
    }

    accessToken = params('access_token');
    expiresIn = params('expires_in');
    token = params('id_token');
    tokenType = params('token_type');
    
    if (token) {
      localStorage.setItem('token', token);
      this.router.navigate(['clusters']);
    }
  };

  public authenticated() {
    // Check if there's an unexpired JWT
    // This searches for an item in localStorage with key == 'token'
    return tokenNotExpired('token');
  };

  public logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
    this.router.navigate(['']);
  };
}
