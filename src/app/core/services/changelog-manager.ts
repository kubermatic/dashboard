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

import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AppConfigService} from '@app/config.service';
import {ChangelogDialog} from '@core/components/changelog/dialog';
import {ChangelogService} from '@core/services/changelog';
import {HistoryService} from '@core/services/history';
import {UserService} from '@core/services/user';
import {View} from '@shared/entity/common';
import {UserSettings} from '@shared/entity/settings';
import {filter, switchMapTo, take} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class ChangelogManagerService {
  constructor(
    private readonly _historyService: HistoryService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _config: AppConfigService,
    private readonly _changelogService: ChangelogService
  ) {}

  init(): void {
    this._historyService.onNavigationChange
      .pipe(switchMapTo(this._userService.currentUser.pipe(take(1))))
      .pipe(filter(user => user.userSettings && this._shouldShowChangelog(user.userSettings)))
      .subscribe(_ => this.open());
  }

  open(): void {
    this._matDialog.open(ChangelogDialog, {
      panelClass: 'km-changelog-dialog',
      disableClose: true,
    });
  }

  private _shouldShowChangelog(settings: UserSettings): boolean {
    return (
      this._changelogService.changelog &&
      !this._historyService.previousURL &&
      this._historyService.currentURL &&
      this._historyService.currentURL.endsWith(View.Projects) &&
      (settings.lastSeenChangelogVersion === undefined ||
        (settings.lastSeenChangelogVersion &&
          settings.lastSeenChangelogVersion !== this._config.getGitVersion().humanReadable))
    );
  }
}
