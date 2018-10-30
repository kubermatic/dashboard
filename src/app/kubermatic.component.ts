import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

import { DevToolsExtension, NgRedux } from '@angular-redux/store';
import { INITIAL_STATE, Store, StoreReducer } from './redux/store';

import { MatSidenav } from '@angular/material';
import { SidenavService } from './core/components/sidenav/sidenav.service';

import { AppConfigService } from './app-config.service';
import { Auth } from './core/services';
import { GoogleAnalyticsService } from './google-analytics.service';
import { Config } from './shared/model/Config';

@Component({
  selector: 'kubermatic-root',
  templateUrl: './kubermatic.component.html',
  styleUrls: ['./kubermatic.component.scss']
})
export class KubermaticComponent implements OnInit {
  @ViewChild('sidenav') public sidenav: MatSidenav;
  public config: Config = {'show_demo_info': false, 'show_terms_of_service': false};

  public constructor(private sidenavService: SidenavService,
                     public auth: Auth,
                     private ngRedux: NgRedux<Store>,
                     private devTools: DevToolsExtension,
                     private appConfigService: AppConfigService,
                     public router: Router,
                     public googleAnalyticsService: GoogleAnalyticsService
  ) {
    let enhancers = [];

    if (this.devTools.isEnabled()) {
      enhancers = [...enhancers, this.devTools.enhancer()];
    }
    this.ngRedux.configureStore(StoreReducer, INITIAL_STATE, null, enhancers);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.googleAnalyticsService.sendPageView(event.urlAfterRedirects);
      }
    });
  }

  public ngOnInit(): void {
    setTimeout(() => {
      this.config = this.appConfigService.getConfig();
      if (this.config.google_analytics_code) {
        this.googleAnalyticsService.activate(
          this.config.google_analytics_code,
          this.config.google_analytics_config,
          this.router.url
        );
      }
    }, 3000);
    this.sidenavService
      .setSidenav(this.sidenav);
  }

  showTermsOfService(): void {
    this.router.navigate(['/terms-of-service']);
  }
}
