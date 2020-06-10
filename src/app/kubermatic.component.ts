import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSidenav} from '@angular/material/sidenav';
import {Title} from '@angular/platform-browser';
import {NavigationEnd, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subject, of} from 'rxjs';
import {takeUntil, filter, switchMap, tap} from 'rxjs/operators';

import {AppConfigService} from './app-config.service';
import {Auth, ProjectService, ClusterService} from './core/services';
import {SettingsService} from './core/services/settings/settings.service';
import {ParamsService, PathParam} from './core/services/params/params.service';
import {GoogleAnalyticsService} from './google-analytics.service';
import {AdminSettings} from './shared/entity/AdminSettings';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config} from './shared/model/Config';
import {CustomLink} from './shared/utils/custom-link-utils/custom-link';

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
  projectName: string;
  clusterName: string;
  private _unsubscribe = new Subject<void>();

  constructor(
    public auth: Auth,
    private appConfigService: AppConfigService,
    private readonly _settingsService: SettingsService,
    public router: Router,
    public googleAnalyticsService: GoogleAnalyticsService,
    private titleService: Title,
    private readonly _params: ParamsService,
    private readonly _projectService: ProjectService,
    private readonly _clusterService: ClusterService
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

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .pipe(switchMap(() => this._projectService.selectedProject))
      .pipe(tap(project => (this.projectName = project ? project.name : '')))
      .pipe(
        switchMap(() =>
          this._params.get(PathParam.ProjectID) &&
          this._params.get(PathParam.ClusterID) &&
          this._params.get(PathParam.SeedDC)
            ? this._clusterService.cluster(
                this._params.get(PathParam.ProjectID),
                this._params.get(PathParam.ClusterID),
                this._params.get(PathParam.SeedDC)
              )
            : of(null)
        )
      )
      .pipe(tap(cluster => (this.clusterName = cluster ? cluster.name : '')))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        if (this._params.get(PathParam.ProjectID)) {
          if (this._params.get(PathParam.ClusterID)) {
            this.titleService.setTitle(this.clusterName + '/' + this.projectName + ' - Kubermatic');
          } else {
            this.titleService.setTitle(this.projectName + ' - Kubermatic');
          }
        } else {
          this.titleService.setTitle('Kubermatic');
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
