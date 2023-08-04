// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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
import {UserService} from '@core/services/user';
import {UserSettings} from '@shared/entity/settings';
import {objectDiff} from '@shared/utils/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, switchMap, takeUntil} from 'rxjs/operators';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 25];

@Component({
  selector: 'km-pagination-page-size',
  templateUrl: 'template.html',
})
export class PaginationPageSizeComponent implements OnInit, OnDestroy {
  readonly options = ITEMS_PER_PAGE_OPTIONS;

  settings: UserSettings; // Local settings copy. User can edit it.
  apiSettings: UserSettings; // Original settings from the API. Cannot be edited by the user.

  private readonly _debounceTime = 500;
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings.itemsPerPage, this.apiSettings?.itemsPerPage)) {
        if (this.apiSettings) {
          this._notificationService.success('Updated the user settings');
        }
        this.apiSettings = settings;
        this.settings = _.cloneDeep(this.apiSettings);
      }
    });

    this._settingsChange
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(() => this._userService.patchCurrentUserSettings(objectDiff(this.settings, this.apiSettings))))
      .subscribe(settings => {
        this.apiSettings = settings;
        this.settings = _.cloneDeep(this.apiSettings);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSettingsChange(): void {
    this._settingsChange.next();
  }

  isSettingEqual(): boolean {
    return _.isEqual(this.settings.itemsPerPage, this.apiSettings.itemsPerPage);
  }
}
