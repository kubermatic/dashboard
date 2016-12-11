import { Component } from '@angular/core';
import {Auth} from "../auth/auth.service";

@Component({
  selector: 'kubermatic-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {

  public isScrolled:boolean = false;

  constructor(private auth: Auth) {
  }

  public login() {
    localStorage.setItem('redirect_url', "dashboard");
    this.auth.login()
  }

  public logout() {
    localStorage.setItem('redirect_url', "welcome");
    this.auth.logout()
  }

  public scrolledChanged(isScrolled) {
    this.isScrolled = isScrolled;
  }
}
