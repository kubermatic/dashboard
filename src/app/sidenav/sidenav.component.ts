import { Component, OnInit } from '@angular/core';

import {Auth} from "../auth/auth.service";

@Component({
  selector: 'kubermatic-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

  constructor(private auth: Auth) { }

  ngOnInit() {
  }

  public login() {
    this.auth.login();
  }

  public logout() {
    this.auth.logout();
  }

}
