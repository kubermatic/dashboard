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

import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {ProjectService} from '@core/services/project/service';
import {SettingsService} from '@core/services/settings/service';
import {UserService} from '@core/services/user/service';
import {environment} from '@environments/environment';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {CustomLink, CustomLinkLocation, filterCustomLinks, UserSettings} from '@shared/entity/settings';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {BehaviorSubject, merge, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-sidenav',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  environment: any = environment;
  customLinks: CustomLink[] = [];
  settings: UserSettings;
  currentUser: Member;
  screenWidth = 0;

  private _selectedProject = {} as Project;
  private _currentGroupConfig: GroupConfig;
  private _isSidenavCollapsed = false;
  private _screenWidth = new BehaviorSubject<number>(window.innerWidth);
  private _unsubscribe = new Subject<void>();

  constructor(
    public dialog: MatDialog,
    private _router: Router,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._screenWidth.subscribe(width => (this.screenWidth = width));

    this._userService.currentUser.subscribe(user => (this.currentUser = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._isSidenavCollapsed = settings.collapseSidenav;
      this.settings = settings;
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      const filtered = filterCustomLinks(settings.customLinks, CustomLinkLocation.Default);
      if (!_.isEqual(this.customLinks, filtered)) {
        this.customLinks = filtered;
      }
    });

    merge(this._projectService.selectedProject, this._projectService.onProjectChange)
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap((project: Project) => {
          this._selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {
    this._screenWidth.next(event.target.innerWidth);
  }

  isSidenavCollapsed(): boolean {
    const maxScreenWidth = 767;
    return this._isSidenavCollapsed || this.screenWidth < maxScreenWidth;
  }

  getLinkClass(url: string): string {
    return this.checkUrl(url) ? 'active' : '';
  }

  checkUrl(url: string): boolean {
    const selectedProjectId = this._selectedProject.id;
    const urlArray = this._router.routerState.snapshot.url.split('/');
    return (
      !!urlArray.find(x => x === selectedProjectId) &&
      (!!urlArray.find(x => x === url) || (url === View.Clusters && !!urlArray.find(x => x === View.Wizard)))
    );
  }

  getRouterLink(target: string): string {
    const selectedProjectId = this._selectedProject.id;
    return `/projects/${selectedProjectId}/${target}`;
  }

  getTooltip(viewName: string): string {
    let tooltip = '';

    if (this.isSidenavCollapsed()) {
      switch (viewName) {
        case View.Clusters:
          tooltip += 'Clusters';
          break;
        case View.SSHKeys:
          tooltip += 'SSH Keys';
          break;
        case View.Members:
          tooltip += 'Members';
          break;
        case View.ServiceAccounts:
          tooltip += 'Service Accounts';
          break;
        case View.Projects:
          tooltip += 'Projects';
          break;
      }
    }

    if (!MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, viewName, Permission.View)) {
      tooltip = 'Cannot enter this view.';
      if (this._selectedProject.status !== 'Active') {
        tooltip += ' Selected project is not active.';
      } else {
        tooltip += ' Missing required rights.';
      }
    }
    return tooltip;
  }

  isCustomLinkPanelVisible(): boolean {
    return !_.isEmpty(this.customLinks);
  }

  getCustomLinkIconStyle(link: CustomLink): any {
    return {
      'background-image': `url('${CustomLink.getIcon(link)}')`,
    };
  }

  getMenuItemClass(viewName: string): string {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, viewName, Permission.View)
      ? ''
      : 'km-disabled';
  }
}
