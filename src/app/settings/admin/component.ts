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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {HistoryService} from '@core/services/history/service';
import {NotificationService} from '@core/services/notification/service';
import {SettingsService} from '@core/services/settings/service';
import {UserService} from '@core/services/user/service';
import {ClusterType} from '@shared/entity/cluster';
import {Member} from '@shared/entity/member';
import {AdminSettings, ClusterTypeOptions} from '@shared/entity/settings';
import {objectDiff} from '@shared/utils/common-utils';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-admin-settings',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  clusterType = ClusterType;
  user: Member;
  selectedDistro = [];
  settings: AdminSettings; // Local settings copy. User can edit it.
  apiSettings: AdminSettings; // Original settings from the API. Cannot be edited by the user.

  private readonly _debounceTime = 500;
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _historyService: HistoryService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings, this.apiSettings)) {
        if (this.apiSettings && !_.isEqual(this.apiSettings, this._settingsService.defaultAdminSettings)) {
          this._notificationService.success('The settings update was applied');
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
      .subscribe(_ => {});
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSettingsChange(): void {
    this._settingsChange.next();
  }

  onDistroChange(group: MatButtonToggleGroup): void {
    this.settings.clusterTypeOptions = this._getDistro(group);
    this.onSettingsChange();
  }

  isLastDistro(group: MatButtonToggleGroup, distro: string): boolean {
    return group.value && group.value.length <= 1 && group.value.indexOf(distro) > -1;
  }

  isOpenShiftEnabled(): boolean {
    return this.selectedDistro.includes(ClusterType.OpenShift);
  }

  resetDefaults(): void {
    this.settings = this._settingsService.defaultAdminSettings;
    this.onSettingsChange();
  }

  goBack(): void {
    this._historyService.goBack('/projects');
  }

  isEqual(a: any, b: any): boolean {
    return _.isEqual(a, b);
  }

  isDisplayLinksEqual(): boolean {
    return (
      this.isEqual(this.settings.displayAPIDocs, this.apiSettings.displayAPIDocs) &&
      this.isEqual(this.settings.displayDemoInfo, this.apiSettings.displayDemoInfo) &&
      this.isEqual(this.settings.displayTermsOfService, this.apiSettings.displayTermsOfService)
    );
  }

  private _applySettings(settings: AdminSettings): void {
    this.apiSettings = settings;
    this.settings = _.cloneDeep(this.apiSettings);
    this._setDistro(this.settings.clusterTypeOptions);
  }

  private _getPatch(): AdminSettings {
    const patch: AdminSettings = objectDiff(this.settings, this.apiSettings);

    if (patch.customLinks) {
      patch.customLinks = this.settings.customLinks;
    }

    return patch;
  }

  private _getDistro(group: MatButtonToggleGroup): ClusterTypeOptions {
    const isKubernetesSelected = group.value && group.value.indexOf(ClusterType.Kubernetes) > -1;
    const isOpenshiftSelected = group.value && group.value.indexOf(ClusterType.OpenShift) > -1;

    if (isKubernetesSelected && isOpenshiftSelected) {
      return ClusterTypeOptions.All;
    } else if (isKubernetesSelected) {
      return ClusterTypeOptions.Kubernetes;
    }
    return ClusterTypeOptions.OpenShift;
  }

  private _setDistro(distro: ClusterTypeOptions): void {
    switch (distro) {
      case ClusterTypeOptions.All:
        this.selectedDistro = [ClusterType.Kubernetes, ClusterType.OpenShift];
        break;
      case ClusterTypeOptions.Kubernetes:
        this.selectedDistro = [ClusterType.Kubernetes];
        break;
      case ClusterTypeOptions.OpenShift:
        this.selectedDistro = [ClusterType.OpenShift];
        break;
    }
  }
}
