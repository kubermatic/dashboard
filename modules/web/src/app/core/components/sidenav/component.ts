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
import {ActivatedRoute, Router} from '@angular/router';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {environment} from '@environments/environment';
import {getViewDisplayName, ProjectSidenavSection, View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {CustomLink, UserSettings} from '@shared/entity/settings';
import {GroupConfig} from '@shared/model/Config';
import {maxScreenWidth} from '@shared/constants/common';
import {MemberUtils, Permission} from '@shared/utils/member';
import {BehaviorSubject, merge, Subject} from 'rxjs';
import {debounceTime, switchMap, takeUntil} from 'rxjs/operators';
import {DynamicModule} from '@app/dynamic/module-registry';
import {WizardMode} from '@app/wizard/types/wizard-mode';

@Component({
  selector: 'km-sidenav',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  readonly view = View;
  readonly projectSidenavSections = ProjectSidenavSection;
  readonly isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  environment: any = environment;
  customLinks: CustomLink[] = [];
  settings: UserSettings;
  currentUser: Member;
  screenWidth = 0;
  areExternalClustersEnabled = false;

  private readonly _debounceTime = 500;
  private _selectedProject = {} as Project;
  private _currentGroupConfig: GroupConfig;
  private _isSidenavCollapsed = false;
  private _screenWidth = new BehaviorSubject<number>(window.innerWidth);
  private _unsubscribe = new Subject<void>();

  get isSidenavCollapsed(): boolean {
    return this._isSidenavCollapsed || this.screenWidth < maxScreenWidth;
  }

  constructor(
    public dialog: MatDialog,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._screenWidth
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(width => (this.screenWidth = width));

    this._userService.currentUser.subscribe(user => (this.currentUser = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._isSidenavCollapsed = settings.collapseSidenav;
      this.settings = settings;
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.areExternalClustersEnabled = settings.enableExternalClusterImport;
      this.customLinks = settings.customLinks;
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

  getLinkClass(url: string): string {
    return this.checkUrl(url) ? 'active' : '';
  }

  checkUrl(url: string): boolean {
    const selectedProjectID = this._selectedProject.id;
    const urlArray = this._router.routerState.snapshot.url.split('/');
    const isProjectAndUrlExists = !!urlArray.find(x => x === selectedProjectID) && !!urlArray.find(x => x === url);
    if (url === View.ClusterTemplates) {
      const mode = this._activatedRoute.snapshot.queryParams?.mode;
      return (
        isProjectAndUrlExists ||
        mode === WizardMode.CreateClusterTemplate ||
        mode === WizardMode.EditClusterTemplate ||
        mode === WizardMode.CustomizeClusterTemplate
      );
    }
    if (url === View.Clusters) {
      return (
        (isProjectAndUrlExists && !urlArray.find(x => x === View.ExternalClusters || x === View.KubeOneClusters)) ||
        !!urlArray.find(x => x === View.Wizard)
      );
    } else if (url === View.ExternalClusters) {
      return isProjectAndUrlExists || !!urlArray.find(x => x === View.ExternalClusterWizard);
    } else if (url === View.KubeOneClusters) {
      return isProjectAndUrlExists || !!urlArray.find(x => x === View.KubeOneWizard);
    }
    return isProjectAndUrlExists;
  }

  getRouterLink(view: View): string {
    return `/projects/${this._selectedProject.id}/${view}`;
  }

  getTooltip(view: View): string {
    let tooltip = this.isSidenavCollapsed ? getViewDisplayName(view) : '';
    if (!MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, view, Permission.View)) {
      tooltip = 'Cannot enter this view.';
      if (this._selectedProject.status !== 'Active') {
        tooltip += ' Selected project is not active.';
      } else {
        tooltip += ' Missing required rights.';
      }
    }
    return tooltip;
  }

  getCustomLinkIconStyle(link: CustomLink): any {
    return {'background-image': `url('${CustomLink.getIcon(link)}')`};
  }

  isDisabledField(view: View): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, view, Permission.View);
  }
}
