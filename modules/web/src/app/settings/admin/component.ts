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
  selector: 'km-admin-settings',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  user: Member;
  settings: AdminSettings; // Local settings copy. User can edit it.
  apiSettings: AdminSettings; // Original settings from the API. Cannot be edited by the user.

  private readonly _debounceTime = 500;
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));

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

  isDisplayLinksEqual(): boolean {
    return (
      this.isEqual(this.settings.displayAPIDocs, this.apiSettings.displayAPIDocs) &&
      this.isEqual(this.settings.displayDemoInfo, this.apiSettings.displayDemoInfo) &&
      this.isEqual(this.settings.displayTermsOfService, this.apiSettings.displayTermsOfService)
    );
  }

  isMLAMonitoringEqual(): boolean {
    return (
      this.isEqual(this.settings.mlaOptions.monitoringEnabled, this.apiSettings.mlaOptions.monitoringEnabled) &&
      this.isEqual(this.settings.mlaOptions.monitoringEnforced, this.apiSettings.mlaOptions.monitoringEnforced)
    );
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
}
