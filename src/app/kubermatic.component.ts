
import { Component, ViewChild} from "@angular/core";


import { MdSidenav } from '@angular/material';
import { SidenavService } from './sidenav/sidenav.service';
import { LocalStorageService } from './services';

@Component({
  selector: "kubermatic-root",
  templateUrl: "./kubermatic.component.html",
  styleUrls: ["./kubermatic.component.scss"]
})
export class KubermaticComponent {
  @ViewChild('sidenav') public sidenav: MdSidenav;


  public constructor(
    private sidenavService: SidenavService,
    private localStorageService: LocalStorageService
  ) {}

  public ngOnInit(): void {
    this.localStorageService.setPageReloaded();
    this.sidenavService
      .setSidenav(this.sidenav);
  }
}
