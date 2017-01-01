import { Component } from "@angular/core";
import {Auth} from "../auth/auth.service";

import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";

@Component({
  selector: "kubermatic-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.scss"]
})
export class NavigationComponent {

  public isScrolled: boolean = false;
  public userProfile: Object;

  constructor(private auth: Auth, private _store: Store<fromRoot.State>) {
    this._store.select(fromRoot.getAuthProfile).subscribe(profile => {
      this.userProfile = profile;
    });
  }

  public login() {
    localStorage.setItem("redirect_url", "dashboard");
    this.auth.login();
  }

  public logout() {
    localStorage.setItem("redirect_url", "welcome");
    this.userProfile = undefined;
    this.auth.logout();
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }
}
