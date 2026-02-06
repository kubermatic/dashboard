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

import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FeatureGateService} from '@app/core/services/feature-gate';
import {VMwareCloudDirectorIPAllocationMode} from '@app/shared/entity/provider/vmware-cloud-director';
import {OperatingSystem} from '@app/shared/model/NodeProviderConstants';
import {NotificationService} from '@core/services/notification';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {VeleroChecksumAlgorithm} from '@shared/entity/backup';
import {Member} from '@shared/entity/member';
import {AdminSettings, AllowedOperatingSystems, StaticLabel} from '@shared/entity/settings';
import {getEditionVersion, objectDiff} from '@shared/utils/common';
import {KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE} from '@app/shared/constants/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-defaults',
  styleUrls: ['style.scss'],
  templateUrl: 'template.html',
  standalone: false,
})
export class DefaultsComponent implements OnInit, OnDestroy {
  user: Member;
  settings: AdminSettings; // Local settings copy. User can edit it.
  apiSettings: AdminSettings; // Original settings from the API. Cannot be edited by the user.
  interfaceTypeUrl = '';
  isOIDCKubeCfgEndpointEnabled = true;
  isOpenIDAuthPluginEnabled = true;
  allowedOperatingSystems: string[] = Object.values(OperatingSystem);
  editionVersion: string = getEditionVersion();

  readonly OperatingSystem = OperatingSystem;
  readonly ipAllocationModes = [VMwareCloudDirectorIPAllocationMode.POOL, VMwareCloudDirectorIPAllocationMode.DHCP];
  readonly veleroChecksumAlgorithms = Object.values(VeleroChecksumAlgorithm);
  readonly KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE = KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE;
  private readonly _debounceTime = 500;
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService,
    private readonly _featureGatesService: FeatureGateService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  get hiddenAnnotations(): string[] {
    return this.settings.annotations?.hiddenAnnotations;
  }

  get protectedAnnotations(): string[] {
    return this.settings.annotations?.protectedAnnotations;
  }

  ngOnInit(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));
    this._featureGatesService.featureGates.pipe(takeUntil(this._unsubscribe)).subscribe(featureGates => {
      this.isOIDCKubeCfgEndpointEnabled = !!featureGates?.oidcKubeCfgEndpoint;
      this.isOpenIDAuthPluginEnabled = !!featureGates?.openIDAuthPlugin;
      this._verifyEnableKubernetesDashboardRequirements();
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      // Soft migration for the web terminal settings.
      if (!settings.webTerminalOptions) {
        settings.webTerminalOptions = {
          enabled: settings.enableWebTerminal,
        };
      } else if (settings.webTerminalOptions.enabled === null || settings.webTerminalOptions.enabled === undefined) {
        settings.webTerminalOptions.enabled = settings.enableWebTerminal;
      }

      if (!_.isEqual(settings, this.apiSettings)) {
        if (this.apiSettings && !_.isEqual(this.apiSettings, this._settingsService.defaultAdminSettings)) {
          this._notificationService.success('Updated the admin settings');
        }
        this._applySettings(settings);
      }

      !_.isEmpty(settings?.allowedOperatingSystems) &&
        (this.allowedOperatingSystems = Object.keys(settings?.allowedOperatingSystems).filter(
          os => settings.allowedOperatingSystems[os] === true
        ));
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

  onHiddenAnnotationsChange(val: string[]): void {
    this.settings.annotations = {...(this.settings.annotations || {}), hiddenAnnotations: val};
    this.onSettingsChange();
  }

  onProtectedAnnotationsChange(val: string[]): void {
    this.settings.annotations = {...(this.settings.annotations || {}), protectedAnnotations: val};
    this.onSettingsChange();
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
    if (this.settings.webTerminalOptions?.enabled) {
      this.settings.webTerminalOptions.enabled = false;
    }

    if (this.settings.enableShareCluster) {
      this.settings.enableShareCluster = false;
    }
    if (this.settings.disableAdminKubeconfig) {
      this.settings.disableAdminKubeconfig = false;
    }

    this.onSettingsChange();
  }

  isKubernetesDashboardFeatureGatesEnabled(): boolean {
    return this.isOIDCKubeCfgEndpointEnabled && this.isOpenIDAuthPluginEnabled;
  }

  onVeleroChecksumAlgorithmChange(value: string) {
    this.settings.clusterBackupOptions = {
      ...(this.settings.clusterBackupOptions || {}),
      defaultChecksumAlgorithm: value,
    };
    this.onSettingsChange();
  }

  onIPAllocationModeChange(val: string[]): void {
    this.settings.providerConfiguration.vmwareCloudDirector.ipAllocationModes = val;
    this.onSettingsChange();
  }

  onOperatingSystemChange(val: string[]): void {
    const allOperatingSystem = Object.values(OperatingSystem);
    if (!val.length) {
      val = allOperatingSystem;
    }
    this.settings.allowedOperatingSystems = {} as AllowedOperatingSystems;
    allOperatingSystem.forEach(os => {
      this.settings.allowedOperatingSystems[os] = val.includes(os) ? true : false;
    });
    this.onSettingsChange();
  }

  onStaticLabelsChange(labels: StaticLabel[]): void {
    if (this._checkLabels(labels)) {
      this.settings.staticLabels = labels;
      this.onSettingsChange();
      this._cdr.detectChanges();
    }
  }

  isLastEnabledOS(os: OperatingSystem): boolean {
    if (this.allowedOperatingSystems.length === 1) {
      return os === this.allowedOperatingSystems[0];
    }
    return false;
  }

  getDocumentationLink(): string {
    return `https://docs.kubermatic.com/kubermatic/${this.editionVersion}/tutorials-howtos/oidc-provider-configuration/share-clusters-via-delegated-oidc-authentication/`;
  }

  private _checkLabels(staticLabels: StaticLabel[]): boolean {
    return staticLabels.every(label => label?.key && label.values?.length);
  }

  private _verifyEnableKubernetesDashboardRequirements() {
    // Note: Kubernetes Dashboard feature requires both feature gates from admin side to be enabled.
    if ((!this.isOIDCKubeCfgEndpointEnabled || !this.isOpenIDAuthPluginEnabled) && this.settings.enableDashboard) {
      this.settings.enableDashboard = false;
      this.onSettingsChange();
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

    if (patch.staticLabels) {
      patch.staticLabels = this.settings.staticLabels;
    }

    if (patch.annotations) {
      patch.annotations = this.settings.annotations;
    }

    return patch;
  }
}
