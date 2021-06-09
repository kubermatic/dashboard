// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DOCUMENT} from '@angular/common';
import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';
import {NavigationEnd, Router} from '@angular/router';
import {Auth} from '@core/services/auth/service';
import {PageTitleService} from '@core/services/page-title';
import {SettingsService} from '@core/services/settings';
import {AdminSettings, CustomLink} from '@shared/entity/settings';
import {VersionInfo} from '@shared/entity/version-info';
import {Config} from '@shared/model/Config';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {AppConfigService} from './config.service';
import {GoogleAnalyticsService} from './google-analytics.service';

const PAGES_WITHOUT_MENU = ['/projects', '/account', '/settings', '/rest-api', '/terms-of-service', '/404'];

@Component({
  selector: 'km-root',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
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
    public router: Router,
    public googleAnalyticsService: GoogleAnalyticsService,
    private readonly appConfigService: AppConfigService,
    private readonly _settingsService: SettingsService,
    private readonly _pageTitleService: PageTitleService,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {
    this._registerRouterWatch();
    this._loadDefaultTheme();
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
        this._pageTitleService.setTitle(event.urlAfterRedirects);
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

  private _loadDefaultTheme(): void {
    const retryDelay = 500;
    const defaultThemeName = 'light';
    const defaultThemeClass = `km-style-${defaultThemeName}`;
    const defaultThemePath = `${defaultThemeName}.css`;
    const positionElement = this._document.head.querySelector('link[rel="stylesheet"]:last-of-type');
    const themeElement: HTMLLinkElement = this._document.createElement('link');
    themeElement.setAttribute('rel', 'stylesheet');
    themeElement.setAttribute('href', defaultThemePath);
    themeElement.classList.add(defaultThemeClass);

    if (!positionElement) {
      setTimeout(this._loadDefaultTheme.bind(this), retryDelay);
      return;
    }

    positionElement.after(themeElement);
  }
}
