import {DevToolsExtension, NgRedux} from '@angular-redux/store';
import {Component, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material';
import {NavigationEnd, Router} from '@angular/router';

import {AppConfigService} from './app-config.service';
import {SidenavService} from './core/components/sidenav/sidenav.service';
import {Auth} from './core/services';
import {GoogleAnalyticsService} from './google-analytics.service';
import {INITIAL_STATE, Store, StoreReducer} from './redux/store';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config} from './shared/model/Config';

@Component({
  selector: 'kubermatic-root',
  templateUrl: './kubermatic.component.html',
  styleUrls: ['./kubermatic.component.scss'],
})
export class KubermaticComponent implements OnInit {
  @ViewChild('sidenav') sidenav: MatSidenav;
  config: Config = {show_demo_info: false, show_terms_of_service: false};
  version: VersionInfo;

  constructor(
      private sidenavService: SidenavService,
      public auth: Auth,
      private ngRedux: NgRedux<Store>,
      private devTools: DevToolsExtension,
      private appConfigService: AppConfigService,
      public router: Router,
      public googleAnalyticsService: GoogleAnalyticsService,
  ) {
    let enhancers = [];

    if (this.devTools.isEnabled()) {
      enhancers = [...enhancers, this.devTools.enhancer()];
    }
    this.ngRedux.configureStore(StoreReducer, INITIAL_STATE, null, enhancers);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.googleAnalyticsService.sendPageView(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit(): void {
    this.config = this.appConfigService.getConfig();
    this.version = this.appConfigService.getGitVersion();
    if (this.config.google_analytics_code) {
      this.googleAnalyticsService.activate(
          this.config.google_analytics_code,
          this.config.google_analytics_config,
          this.router.url,
      );
    }
    this.sidenavService.setSidenav(this.sidenav);
    this.registerCustomCSS();
  }

  registerCustomCSS(): void {
    if (this.appConfigService.hasCustomCSS()) {
      const href = this.appConfigService.getCustomCSS();
      const id = 'custom-css-id';
      const element = document.getElementById(id);
      if (element) {
        element['href'] = href;
      } else {
        const node = document.createElement('link');
        node.rel = 'stylesheet';
        node.href = href;
        node.id = id;
        document.getElementsByTagName('head')[0].appendChild(node);
      }
    }
  }
}
