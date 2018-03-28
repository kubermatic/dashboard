import { Component, OnInit, ViewChild } from '@angular/core';

import { DevToolsExtension, NgRedux } from '@angular-redux/store';
import { INITIAL_STATE, Store, StoreReducer } from './redux/store';

import { MatSidenav } from '@angular/material';
import { SidenavService } from './core/components/sidenav/sidenav.service';

import { Auth } from './core/services';

@Component({
  selector: 'kubermatic-root',
  templateUrl: './kubermatic.component.html',
  styleUrls: ['./kubermatic.component.scss']
})
export class KubermaticComponent implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav;

  public constructor(private sidenavService: SidenavService,
                     public auth: Auth,
                     private ngRedux: NgRedux<Store>,
                     private devTools: DevToolsExtension) {
    let enhancers = [];

    if (devTools.isEnabled()) {
      enhancers = [...enhancers, devTools.enhancer()];
    }
    this.ngRedux.configureStore(StoreReducer, INITIAL_STATE, null, enhancers);
  }

  public ngOnInit(): void {
    this.sidenavService
      .setSidenav(this.sidenav);
  }
}
