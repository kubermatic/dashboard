import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {BehaviorSubject, merge, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {MemberEntity, UserSettings} from '../../../shared/entity/MemberEntity';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {CustomLink, CustomLinkLocation, filterCustomLinks} from '../../../shared/utils/custom-link-utils/custom-link';
import {MemberUtils, Permission} from '../../../shared/utils/member-utils/member-utils';
import {ProjectService, UserService} from '../../services';
import {View} from '../../services/auth/auth.guard';
import {SettingsService} from '../../services/settings/settings.service';

@Component({
  selector: 'km-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  environment: any = environment;
  customLinks: CustomLink[] = [];
  settings: UserSettings;
  currentUser: MemberEntity;
  screenWidth = 0;
  private _selectedProject = {} as ProjectEntity;
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

    this._userService.loggedInUser.subscribe(user => (this.currentUser = user));

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      const filtered = filterCustomLinks(settings.customLinks, CustomLinkLocation.Default);
      if (!_.isEqual(this.customLinks, filtered)) {
        this.customLinks = filtered;
      }
    });

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._isSidenavCollapsed = settings.collapseSidenav;
      this.settings = settings;
    });

    merge(this._projectService.selectedProject, this._projectService.onProjectChange)
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap((project: ProjectEntity) => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        })
      )
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.userGroupConfig(userGroup)));
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
    return this._isSidenavCollapsed || this.screenWidth < 767;
  }

  getLinkClass(url: string): string {
    return this.checkUrl(url) ? 'active' : '';
  }

  checkUrl(url: string): boolean {
    const selectedProjectId = this._selectedProject.id;
    const urlArray = this._router.routerState.snapshot.url.split('/');
    return (
      !!urlArray.find(x => x === selectedProjectId) &&
      (!!urlArray.find(x => x === url) || (url === 'clusters' && !!urlArray.find(x => x === 'wizard')))
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
