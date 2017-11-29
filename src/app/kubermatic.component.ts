
import { Component, ViewChild} from "@angular/core";
import {Auth} from "./auth/auth.service";

import { MdSidenav } from '@angular/material';
import { SidenavService } from './sidenav/sidenav.service';

@Component({
  selector: "kubermatic-root",
  templateUrl: "./kubermatic.component.html",
  styleUrls: ["./kubermatic.component.scss"]
})
export class KubermaticComponent {
  @ViewChild('sidenav') public sidenav: MdSidenav;


  public constructor(
    private sidenavService: SidenavService,
    public auth: Auth
  ) {}

  public ngOnInit(): void {
    this.sidenavService
      .setSidenav(this.sidenav);
  }
}
