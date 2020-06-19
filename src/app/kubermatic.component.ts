import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';
import {NavigationEnd, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {AppConfigService} from './app-config.service';
import {Auth} from './core/services';
import {SettingsService} from './core/services/settings/settings.service';
import {GoogleAnalyticsService} from './google-analytics.service';
import {AdminSettings, CustomLink} from './shared/entity/settings';
import {VersionInfo} from './shared/entity/version-info';
import {Config} from './shared/model/Config';

const PAGES_WITHOUT_MENU = ['/projects', '/account', '/settings', '/rest-api', '/terms-of-service', '/404'];

@Component({
  selector: 'km-root',
  templateUrl: './kubermatic.component.html',
  styleUrls: ['./kubermatic.component.scss'],
})
export class KubermaticComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenav;
  config: Config = {};
  settings: AdminSettings;
  customLinks: CustomLink[] = [];
  version: VersionInfo;
  showMenuSwitchAndProjectSelector = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    public auth: Auth,
    private appConfigService: AppConfigService,
    private readonly _settingsService: SettingsService,
    public router: Router,
    public googleAnalyticsService: GoogleAnalyticsService
  ) {
    this._registerRouterWatch();
  }

  ngOnInit(): void {
    this.config = this.appConfigService.getConfig();
    this.version = this.appConfigService.getGitVersion();
    if (this.config.google_analytics_code) {
      this.googleAnalyticsService.activate(
        this.config.google_analytics_code,
        this.config.google_analytics_config,
        this.router.url
      );
    }

    this._settingsService.customLinks
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(customLinks => (this.customLinks = customLinks));

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(this.settings, settings)) {
        this.settings = settings;
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _registerRouterWatch(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this._handleSidenav(event.urlAfterRedirects);
        this.googleAnalyticsService.sendPageView(event.urlAfterRedirects);
      }
    });
  }

  private _handleSidenav(url: string): void {
    if (this.sidenav) {
      if (PAGES_WITHOUT_MENU.includes(url)) {
        this.sidenav.close();
        this.showMenuSwitchAndProjectSelector = false;
      } else {
        this.sidenav.open();
        this.showMenuSwitchAndProjectSelector = true;
      }
    }
  }
}
