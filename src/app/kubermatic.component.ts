import {OverlayContainer} from '@angular/cdk/overlay';
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';
import {NavigationEnd, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {AppConfigService} from './app-config.service';
import {Auth} from './core/services';
import {SettingsService} from './core/services/settings/settings.service';
import {GoogleAnalyticsService} from './google-analytics.service';
import {AdminSettings} from './shared/entity/AdminSettings';
import {Theme} from './shared/entity/MemberEntity';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config} from './shared/model/Config';

const PAGES_WIITHOUT_MENU = [
  '/projects',
  '/account',
  '/settings',
  '/rest-api',
  '/terms-of-service',
  '/404',
];

@Component({
  selector: 'kubermatic-root',
  templateUrl: './kubermatic.component.html',
  styleUrls: ['./kubermatic.component.scss'],
})
export class KubermaticComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenav;
  config: Config = {};
  settings: AdminSettings;
  version: VersionInfo;
  private _theme = Theme.Light;
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _overlayContainer: OverlayContainer, private readonly _elementRef: ElementRef, public auth: Auth,
      private appConfigService: AppConfigService, private readonly _settingsService: SettingsService,
      public router: Router, public googleAnalyticsService: GoogleAnalyticsService) {
    this._registerRouterWatch();
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

    this._applyTheme(this._theme);
    this._registerCustomCSS();

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(this.settings, settings)) {
        this.settings = settings;
      }
    });

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(this._theme, settings.selectedTheme)) {
        this._applyTheme(settings.selectedTheme, this._theme);
        this._theme = settings.selectedTheme;
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _applyTheme(newTheme: Theme, oldTheme: Theme = null): void {
    if (!this.config.disable_themes) {
      if (oldTheme) {
        this._overlayContainer.getContainerElement().classList.remove(oldTheme);
      }

      this._overlayContainer.getContainerElement().classList.add(newTheme);
      this._elementRef.nativeElement.classList.add(newTheme);

      if (oldTheme) {
        this._elementRef.nativeElement.classList.remove(oldTheme);
      }
    }
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
      if (PAGES_WIITHOUT_MENU.includes(url)) {
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
