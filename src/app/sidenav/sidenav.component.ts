import { Component, OnInit } from '@angular/core';
import {Auth} from "../core/services";
import { environment } from "../../environments/environment";

@Component({
  selector: 'kubermatic-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

  public environment : any = environment;

  constructor(public auth: Auth) { }

  ngOnInit() {
  }

  public logout() {
    this.auth.logout();
  }

}
