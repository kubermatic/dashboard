import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {CustomLink, CustomLinkLocation} from '../../../shared/utils/custom-link-utils/custom-link';
import {ProjectService, UserService} from '../../services';

@Component({
  selector: 'kubermatic-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  environment: any = environment;
  customLinks: CustomLink[] = [];
  private _selectedProject = {} as ProjectEntity;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe = new Subject<void>();

  constructor(
      public dialog: MatDialog, private _router: Router, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.customLinks = this._appConfigService.getCustomLinks(CustomLinkLocation.Default);

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(project => {
          this._selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        }))
        .subscribe(userGroup => this._currentGroupConfig = this._userService.getUserGroupConfig(userGroup));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getLinkClass(url: string): string {
    return this.checkUrl(url) ? 'active' : '';
  }

  checkUrl(url: string): boolean {
    const selectedProjectId = this._selectedProject.id;
    const urlArray = this._router.routerState.snapshot.url.split('/');
    return !!urlArray.find((x) => x === selectedProjectId) &&
        (!!urlArray.find((x) => x === url) || (url === 'clusters' && !!urlArray.find((x) => x === 'wizard')));
  }

  getRouterLink(target: string): string {
    const selectedProjectId = this._selectedProject.id;
    return `/projects/${selectedProjectId}/${target}`;
  }

  getTooltip(viewName: string): string {
    let tooltip: string;
    if (!this._hasViewPermissions(viewName)) {
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
    return this.customLinks && this.customLinks.length > 0;
  }

  getCustomLinkIconStyle(link: CustomLink): any {
    return {
      'background-image': `url('${CustomLink.getIcon(link)}')`,
    };
  }

  getMenuItemClass(viewName: string): string {
    return this._hasViewPermissions(viewName) ? '' : 'km-disabled';
  }

  private _hasViewPermissions(viewName): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig[viewName].view;
  }
}
