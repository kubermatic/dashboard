import {Injectable} from "@angular/core";
import {Router, NavigationStart} from "@angular/router";
import {tokenNotExpired} from "angular2-jwt";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Actions} from "../reducers/actions";

// Avoid name not found warnings
//const Auth0Lock = require("auth0-lock").default;

@Injectable()
export class Auth {

  //public static readonly AUTH0_LOCK_CONTAINER_ID = "embedded-lock";

  // Configure Auth0
  /*private lock = new Auth0Lock("zqaGAqBGiWD6tce7fcHL03QZYi1AC9wF", "kubermatic.eu.auth0.com", {
      theme: {
        logo: "https://w3alpha.com/cms/templates/166/img/logo.svg",
        primaryColor: "#2f4050"
      },
      auth: {
        autoParseHash: false,
        params: {scope: "openid app_metadata"}
      },
      container: Auth.AUTH0_LOCK_CONTAINER_ID
    }
  );*/

  public static getBearerToken(): string {
    return localStorage.getItem("token");
  }

  constructor(private router: Router, private store: Store<fromRoot.State>) {
    /*this.lock.on("authenticated", (authResult) => {
      localStorage.setItem("token", authResult.idToken);
      this.store.dispatch({ type: Actions.LOGGED_IN, payload: { token: authResult.idToken, profile: [] } });

      this.lock.getUserInfo(authResult.accessToken, function(error: any, profile: any){
        if (error) {
          throw new Error(error); // TODO make global error state?!
        }

        localStorage.setItem("profile", JSON.stringify(profile));

        // Redirect if there is a saved url to do so.
        const redirectUrl: string = localStorage.getItem("redirect_url");
        if (redirectUrl !== undefined) {
          router.navigate([redirectUrl]);
          localStorage.removeItem("redirect_url");
        }

        store.dispatch({ type: Actions.FETCH_PROFILE, payload: { profile: profile } });
      });
    });*/

    if (this.authenticated()) {
      const idToken = Auth.getBearerToken();
      const profile = JSON.parse(localStorage.getItem("profile"));
      this.store.dispatch({ type: Actions.LOGGED_IN, payload: { token: idToken, profile: profile } });
    }

    this.handleAuthenticationWithHash();
  }

  private handleAuthenticationWithHash(): void {
    this.router.events
      .filter(event => event instanceof NavigationStart)
      .filter((event: NavigationStart) => (/access_token|token|error/).test(event.url))
      .subscribe(event => {
        //this.lock.resumeAuth(window.location.hash, (error, authResult) => {});
      });
  }


  public login() {
    // Call the show method to display the widget.
    //this.lock.show();

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

    }
  };

  public authenticated() {
    // Check if there's an unexpired JWT
    // This searches for an item in localStorage with key == 'id_token'
    return tokenNotExpired('token');
  };

  public logout() {
    // Remove token from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("profile");

    this.router.navigate(['/login']);
  };
}
