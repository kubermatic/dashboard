import { Component } from '@angular/core';
import {Auth} from "../auth/auth.service";

@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {

  public isScrolled:boolean = false;
  public userProfile: Object;

  constructor(private auth: Auth) {
    this.userProfile = JSON.parse(localStorage.getItem('profile'));
  }

  public login() {
    console.log("Starting logging");
    localStorage.setItem('redirect_url', "dashboard");
    this.auth.login()
  }

  public logout() {
    localStorage.setItem('redirect_url', "welcome");
    this.userProfile = undefined;
    this.auth.logout()
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }
}
