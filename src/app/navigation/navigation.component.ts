import {Component} from "@angular/core";
import {Auth} from "../auth/auth.service";

import {SidenavService} from "../sidenav/sidenav.service";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";


@Component({
  selector: "kubermatic-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.scss"]
})
export class NavigationComponent {

  public isScrolled: boolean = false;
  //public userProfile: any;

  constructor(private auth: Auth, private sidenavService: SidenavService, private store: Store<fromRoot.State>) {
    /*this.store.select(fromRoot.getAuthProfile).subscribe(profile => {
      this.userProfile = profile;
    });*/
  }

  public login() {
    //localStorage.setItem("redirect_url", "welcome");
    this.auth.login();
  }

  public logout() {
    //localStorage.setItem("redirect_url", "welcome");
    //this.userProfile = undefined;
    this.auth.logout();
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }

  public toggleSidenav() {
    this.sidenavService
      .toggle()
      .then(() => { });
  }
}
