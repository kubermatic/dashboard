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
import {MatDialog} from '@angular/material/dialog';
import {isEnterpriseEdition} from '@app/dynamic/common';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {environment} from '@environments/environment';
import {Member} from '@shared/entity/member';
import {CustomLink, UserSettings} from '@shared/entity/settings';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-admin-sidenav',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AdminSidenavComponent implements OnInit, OnDestroy {
  environment: any = environment;
  customLinks: CustomLink[] = [];
  settings: UserSettings;
  currentUser: Member;
  screenWidth = 0;

  private _unsubscribe = new Subject<void>();

  get isEnterpriseEdition(): boolean {
    return isEnterpriseEdition();
  }

  constructor(
    public dialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.subscribe(user => (this.currentUser = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
    });

    this._settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this.customLinks = settings.customLinks));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
