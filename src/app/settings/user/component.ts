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
import {HistoryService} from '@core/services/history';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {UserSettings} from '@shared/entity/settings';
import {objectDiff} from '@shared/utils/common-utils';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-user-settings',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  readonly itemsPerPageOptions = [5, 10, 15, 20, 25];
  projects: Project[] = [];
  projectIds: string[] = [];
  user: Member;
  settings: UserSettings; // Local settings copy. User can edit it.
  apiSettings: UserSettings; // Original settings from the API. Cannot be edited by the user.

  private readonly _debounceTime = 1000;
  private _settingsChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _historyService: HistoryService,
    private readonly _notificationService: NotificationService,
    private readonly _projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.user = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (!_.isEqual(settings, this.apiSettings)) {
        if (this.apiSettings) {
          this._notificationService.success('An external settings update was applied');
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

    this._projectService.projects.pipe(takeUntil(this._unsubscribe)).subscribe(projects => {
      this.projects = projects;
      this.projectIds = this.projects.map(p => p.id);
      this._checkDefaultProject();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSettingsChange(): void {
    this._settingsChange.next();
  }

  goBack(): void {
    this._historyService.goBack('/projects');
  }

  isEqual(a: any, b: any): boolean {
    return _.isEqual(a, b);
  }

  hasDefaultProject(): string {
    return this.settings.selectedProjectId ? '' : 'None';
  }

  private _checkDefaultProject(): void {
    if (!!this.settings.selectedProjectId && !this.projectIds.includes(this.settings.selectedProjectId)) {
      this.settings.selectedProjectId = '';
      this.onSettingsChange();
    }
  }
}
