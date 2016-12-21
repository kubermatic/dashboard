import { Injectable } from "@angular/core";
import {Router} from "@angular/router";

import { tokenNotExpired } from "angular2-jwt";
import {GlobalState} from "../global.state";

// Avoid name not found warnings
let Auth0Lock = require("auth0-lock").default;

@Injectable()
export class Auth {

  // Configure Auth0
  private lock = new Auth0Lock("zqaGAqBGiWD6tce7fcHL03QZYi1AC9wF",
    "kubermatic.eu.auth0.com", {
      theme: {
        logo: "https://w3alpha.com/cms/templates/166/img/logo.svg",
        primaryColor: "#445f73"
      }});

  constructor(private _router: Router, private _state: GlobalState) {
    // Add callback for lock `authenticated` event
    this.lock.on("authenticated", (authResult) => {
      localStorage.setItem("id_token", authResult.idToken);

      this.lock.getProfile(authResult.idToken, function(error: any, profile: any){
        if (error) {
          throw new Error(error);
        }

        localStorage.setItem("profile", JSON.stringify(profile));

        // Redirect if there is a saved url to do so.
        let redirectUrl: string = localStorage.getItem("redirect_url");
        if (redirectUrl !== undefined) {
          _router.navigate([redirectUrl]);
          localStorage.removeItem("redirect_url");
        }

        console.log("Auth calling notifyDataChanged with " + JSON.stringify(profile));
        this._state.notifyDataChanged("auth.authenticated", profile);
      });
    });
  }

  public login() {
    // Call the show method to display the widget.
    this.lock.show();
  };

  public authenticated() {
    // Check if there's an unexpired JWT
    // This searches for an item in localStorage with key == 'id_token'
    return tokenNotExpired();
  };

  public getBearerToken(): string {
    return localStorage.getItem("id_token");
  }

  public logout() {
    // Remove token from localStorage
    localStorage.removeItem("id_token");
    localStorage.removeItem("profile");

    // Redirect if there is a saved url to do so.
    let redirectUrl: string = localStorage.getItem("redirect_url");
    if (redirectUrl !== undefined) {
      this._router.navigate([redirectUrl]);
      localStorage.removeItem("redirect_url");
    }
  };
}
