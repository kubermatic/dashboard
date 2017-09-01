import {Component} from "@angular/core";
import {Auth} from "../auth/auth.service";

import {SidenavService} from "../sidenav/sidenav.service";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Router} from '@angular/router';
import {environment} from "../../environments/environment";


@Component({
  selector: "kubermatic-navigation",
  templateUrl: "./navigation.component.html",
  styleUrls: ["./navigation.component.scss"]
})
export class NavigationComponent {

  public isScrolled: boolean = false;
  public environment : any = environment;

  //public userProfile: any;

  constructor(
    public auth: Auth, 
    private sidenavService: SidenavService, 
    private store: Store<fromRoot.State>,
    private router: Router
  ) {}

  public logout() {
    this.router.navigate(['']);
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
