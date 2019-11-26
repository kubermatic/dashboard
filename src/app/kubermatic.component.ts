import {DevToolsExtension, NgRedux} from '@angular-redux/store';
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material';
import {NavigationEnd, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {AppConfigService} from './app-config.service';
import {Auth} from './core/services';
import {SettingsService} from './core/services/settings/settings.service';
import {GoogleAnalyticsService} from './google-analytics.service';
import {INITIAL_STATE, Store, StoreReducer} from './redux/store';
import {AdminSettings} from './shared/entity/AdminSettings';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config} from './shared/model/Config';

@Component({
  selector: 'kubermatic-root',
  templateUrl: './kubermatic.component.html',
  styleUrls: ['./kubermatic.component.scss'],
})
export class KubermaticComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav', {static: false}) sidenav: MatSidenav;
  config: Config = {};
  settings: AdminSettings;
  version: VersionInfo;
  private _unsubscribe = new Subject<void>();

  constructor(
      public auth: Auth, private ngRedux: NgRedux<Store>, private devTools: DevToolsExtension,
      private appConfigService: AppConfigService, private readonly _settingsService: SettingsService,
      public router: Router, public googleAnalyticsService: GoogleAnalyticsService) {
    let enhancers = [];
    if (this.devTools.isEnabled()) {
      enhancers = [...enhancers, this.devTools.enhancer()];
    }
    this.ngRedux.configureStore(StoreReducer, INITIAL_STATE, null, enhancers);

    this._registerRouterWatch();
  }

  ngOnInit(): void {
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(this.settings, settings)) {
        this.settings = settings;
      }
    });

    this.config = this.appConfigService.getConfig();
    this.version = this.appConfigService.getGitVersion();
    if (this.config.google_analytics_code) {
      this.googleAnalyticsService.activate(
          this.config.google_analytics_code,
          this.config.google_analytics_config,
          this.router.url,
      );
    }

    this._registerCustomCSS();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _registerRouterWatch(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this._handleSidenav(event.urlAfterRedirects);
        this.googleAnalyticsService.sendPageView(event.urlAfterRedirects);
      }
    });
  }

  private _handleSidenav(url: string): void {
    if (this.sidenav) {
      if (url === '/projects' || url === '/rest-api' || url === '/account' || url === '/settings') {
        this.sidenav.close();
      } else {
        this.sidenav.open();
      }
    }
  }

  private _registerCustomCSS(): void {
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
