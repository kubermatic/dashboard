import { Component, OnInit, ViewChild } from "@angular/core";

import { NgRedux, DevToolsExtension  } from '@angular-redux/store';
import { Store, INITIAL_STATE, StoreReducer } from "./redux/store";

import { MdSidenav } from '@angular/material';
import { SidenavService } from './core/components/sidenav/sidenav.service';

@Component({
  selector: "kubermatic-root",
  templateUrl: "./kubermatic.component.html",
  styleUrls: ["./kubermatic.component.scss"]
})
export class KubermaticComponent implements OnInit {
  @ViewChild('sidenav') public sidenav: MdSidenav;

  public constructor(
    private sidenavService: SidenavService,

    private ngRedux: NgRedux<Store>,
    private devTools: DevToolsExtension,
  ) {
    let enhancers = [];

    if (devTools.isEnabled()) {
        enhancers = [ ...enhancers, devTools.enhancer() ];
    }
    this.ngRedux.configureStore(StoreReducer, INITIAL_STATE, null, enhancers);
  }

  public ngOnInit(): void {
    this.sidenavService
      .setSidenav(this.sidenav);
  }
}
