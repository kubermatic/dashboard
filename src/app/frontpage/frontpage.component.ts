import { Component, OnInit } from '@angular/core';
import {Auth} from "../auth/auth.service";

@Component({
  selector: 'kubermatic-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.scss']
})
export class FrontpageComponent {

  constructor(private auth: Auth) {
    localStorage.setItem('redirect_url', "dashboard");
  }


}
