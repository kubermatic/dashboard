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

import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {environment} from '@environments/environment';
import {Member} from '@shared/entity/member';
import {CustomLink, UserSettings} from '@shared/entity/settings';
import {sidenavCollapsibleWidth} from '@shared/constants/common';
import {BehaviorSubject, Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {HistoryService} from '@core/services/history';
import {AdminPanelSections, AdminPanelView, AdminPanelViewDisplayName} from '@app/shared/entity/common';
import {DynamicModule} from '@app/dynamic/module-registry';
@Component({
  selector: 'km-admin-sidenav',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AdminSidenavComponent implements OnInit, OnDestroy {
  readonly isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  readonly adminPanelView = AdminPanelView;
  readonly adminPanelViewDisplayName = AdminPanelViewDisplayName;
  readonly adminPanelSections = AdminPanelSections;
  environment: any = environment;
  customLinks: CustomLink[] = [];
  settings: UserSettings;
  currentUser: Member;
  screenWidth = 0;

  private readonly _debounceTime = 500;
  private _unsubscribe = new Subject<void>();
  private _isSidenavCollapsed = false;
  private _screenWidth = new BehaviorSubject<number>(window.innerWidth);

  get isSidenavCollapsed(): boolean {
    return this._isSidenavCollapsed || this.screenWidth <= sidenavCollapsibleWidth;
  }

  constructor(
    public dialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService,
    private readonly _historyService: HistoryService
  ) {}

  ngOnInit(): void {
    this._screenWidth
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(width => (this.screenWidth = width));

    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.currentUser = user));
    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
      this._isSidenavCollapsed = this.settings.collapseSidenav;
    });
    this._settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => (this.customLinks = settings.customLinks));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {
    this._screenWidth.next(event.target.innerWidth);
  }

  goBack(): void {
    this._historyService.goBack('/projects');
  }

  getRouterLink(view: string): string {
    return `/settings/${view}`;
  }
}
