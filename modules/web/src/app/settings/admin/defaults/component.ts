// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FeatureGateService} from '@app/core/services/feature-gate';
import {AdminPanelView} from '@app/shared/entity/common';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {Member} from '@shared/entity/member';
import {AdminSettings} from '@shared/entity/settings';
import {objectDiff} from '@shared/utils/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-admin-settings-defaults',
  styleUrls: ['style.scss'],
  templateUrl: 'template.html',
})
export class DefaultsAndLimitsComponent implements OnInit, OnDestroy {
  user: Member;
  settings: AdminSettings; // Local settings copy. User can edit it.
  apiSettings: AdminSettings; // Original settings from the API. Cannot be edited by the user.
  interfaceTypeUrl = '';
  isOIDCKubeCfgEndpointEnabled = true;
  isOpenIDAuthPluginEnabled = true;

  readonly adminPanelView = AdminPanelView;
  private readonly _debounceTime = 500;
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService,
    private readonly _featureGatesService: FeatureGateService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));
    this._getInterfaceTypeUrl();
    this._featureGatesService.featureGates.pipe(takeUntil(this._unsubscribe)).subscribe(featureGates => {
      this.isOIDCKubeCfgEndpointEnabled = !!featureGates?.oidcKubeCfgEndpoint;
      this.isOpenIDAuthPluginEnabled = !!featureGates?.openIDAuthPlugin;
      this._verifyEnableKubernetesDashboardRequirements();
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings, this.apiSettings)) {
        if (this.apiSettings && !_.isEqual(this.apiSettings, this._settingsService.defaultAdminSettings)) {
          this._notificationService.success('Updated the admin settings');
        }
        this._applySettings(settings);
      }
    });

    this._settingsChange
      .pipe(
        debounceTime(this._debounceTime),
        switchMap(() => this._settingsService.patchAdminSettings(this._getPatch())),
        takeUntil(this._unsubscribe)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSettingsChange(): void {
    this._settingsChange.next();
  }

  isEqual(a: any, b: any): boolean {
    return _.isEqual(a, b);
  }

  isMLALoggingEqual(): boolean {
    return (
      this.isEqual(this.settings.mlaOptions.loggingEnabled, this.apiSettings.mlaOptions.loggingEnabled) &&
      this.isEqual(this.settings.mlaOptions.loggingEnforced, this.apiSettings.mlaOptions.loggingEnforced)
    );
  }

  isMLAMonitoringEqual(): boolean {
    return (
      this.isEqual(this.settings.mlaOptions.monitoringEnabled, this.apiSettings.mlaOptions.monitoringEnabled) &&
      this.isEqual(this.settings.mlaOptions.monitoringEnforced, this.apiSettings.mlaOptions.monitoringEnforced)
    );
  }

  onOIDCKubeconfigSettingsChange(): void {
    if (this.settings.enableWebTerminal) {
      this.settings.enableWebTerminal = false;
    }
    this.onSettingsChange();
  }

  isKubernetesDashboardFeatureGatesEnabled(): boolean {
    return this.isOIDCKubeCfgEndpointEnabled && this.isOpenIDAuthPluginEnabled;
  }

  private _verifyEnableKubernetesDashboardRequirements() {
    // Note: Kubernetes Dashboard feature requires both feature gates from admin side to be enabled.
    if (!this.isOIDCKubeCfgEndpointEnabled || !this.isOpenIDAuthPluginEnabled) {
      if (this.settings.enableDashboard) {
        this.settings.enableDashboard = false;
        this.onSettingsChange();
      }
    }
  }

  private _applySettings(settings: AdminSettings): void {
    this.apiSettings = settings;
    this.settings = _.cloneDeep(this.apiSettings);
  }

  private _getPatch(): AdminSettings {
    const patch: AdminSettings = objectDiff(this.settings, this.apiSettings);

    if (patch.customLinks) {
      patch.customLinks = this.settings.customLinks;
    }

    return patch;
  }

  private _getInterfaceTypeUrl(): void {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    this.interfaceTypeUrl = urlArray[urlArray.length - 1];
  }
}
