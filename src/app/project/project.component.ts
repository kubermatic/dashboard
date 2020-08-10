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

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {CookieService} from 'ngx-cookie-service';
import {Subject} from 'rxjs';
import {filter, first, switchMap, takeUntil, tap} from 'rxjs/operators';

import {Cookie, COOKIE_DI_TOKEN} from '../app.config';
import {NotificationService, ProjectService, UserService} from '../core/services';
import {PreviousRouteService} from '../core/services/previous-route/previous-route.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {AddProjectDialogComponent} from '../shared/components/add-project-dialog/add-project-dialog.component';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {View} from '../shared/entity/common';
import {Member} from '../shared/entity/member';
import {Project, ProjectOwners} from '../shared/entity/project';
import {UserSettings} from '../shared/entity/settings';
import {MemberUtils, Permission} from '../shared/utils/member-utils/member-utils';
import {ProjectUtils} from '../shared/utils/project-utils/project-utils';

import {EditProjectComponent} from './edit-project/edit-project.component';

@Component({
  selector: 'km-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComponent implements OnInit, OnChanges, OnDestroy {
  projects: Project[] = [];
  currentUser: Member;
  isInitializing = true;
  role = new Map<string, string>();
  displayedColumns: string[] = ['status', 'name', 'labels', 'id', 'role', 'clusters', 'owners', 'actions'];
  dataSource = new MatTableDataSource<Project>();
  isPaginatorVisible = false;
  showCards = true;

  private readonly _maxOwnersLen = 30;
  private _settings: UserSettings;
  private _settingsChange = new EventEmitter<void>();
  private _unsubscribe: Subject<any> = new Subject();

  paginator: MatPaginator;
  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    this.paginator = mp;

    if (this.paginator && this._settings) {
      this.paginator.pageSize = this._settings.itemsPerPage;
      this.isPaginatorVisible = this._isPaginatorVisible();
    }

    this.dataSource.paginator = this.paginator;
    this._cdr.detectChanges();
  }

  sort: MatSort;
  @ViewChild(MatSort)
  set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _router: Router,
    private readonly _cookieService: CookieService,
    private readonly _notificationService: NotificationService,
    private readonly _previousRouteService: PreviousRouteService,
    private readonly _cdr: ChangeDetectorRef,
    @Inject(COOKIE_DI_TOKEN) private readonly _cookie: Cookie
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.projects;

    this._userService.currentUser.subscribe(user => {
      this.currentUser = user;
      this._loadCurrentUserRoles();
    });

    this._userService.currentUserSettings
      .pipe(
        tap(settings => {
          this._settings = settings;
          this.showCards = !settings.selectProjectTableView;
        })
      )
      .pipe(filter(_ => !this._settings))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.selectDefaultProject());

    this._settingsChange
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap(() =>
          this._userService.patchCurrentUserSettings({selectProjectTableView: !this.showCards} as UserSettings)
        )
      )
      .subscribe();

    this._projectService.projects.pipe(takeUntil(this._unsubscribe)).subscribe((projects: Project[]) => {
      if (projects) {
        this.projects = projects;
      }

      this.projects = this._sortProjects(this.projects);
      this._loadCurrentUserRoles();
      this.dataSource.data = this.projects;
      this._sortProjectOwners();

      if (this._shouldRedirectToCluster()) {
        this._redirectToCluster();
      }
      this.isInitializing = false;
      this.selectDefaultProject();
      this._cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngOnChanges(): void {
    this.dataSource.data = this.projects;
    this._cdr.detectChanges();
  }

  private _loadCurrentUserRoles(): void {
    if (!!this.currentUser && !!this.currentUser.projects) {
      this.currentUser.projects.forEach(mp => this.role.set(mp.id, MemberUtils.getGroupDisplayName(mp.group)));
    }

    if (this.projects) {
      this.projects
        .filter(p => p.owners.map(o => o.email).includes(this.currentUser.email))
        .forEach(p => this.role.set(p.id, 'Owner'));
    }
  }

  setDataSourceAttributes(): void {
    this.dataSource.sort = this.sort;
  }

  getRole(project: string): string {
    return this.role.get(project);
  }

  private _sortProjectOwners(): void {
    this.projects.forEach(
      project =>
        (project.owners = _.sortBy(
          project.owners,
          o => o.name.toLowerCase(),
          o => o.email.toLowerCase()
        ))
    );
  }

  private _sortProjects(projects): Project[] {
    const ownProjectIds =
      !!this.currentUser && !!this.currentUser.projects ? this.currentUser.projects.map(mp => mp.id) : [];
    const ownProjects = projects.filter(p => ownProjectIds.includes(p.id));
    const externalProjects = projects.filter(p => !ownProjectIds.includes(p.id));

    return _.sortBy(
      ownProjects,
      p => p.name.toLowerCase(),
      p => p.id.toLowerCase()
    ).concat(
      _.sortBy(
        externalProjects,
        p => p.name.toLowerCase(),
        p => p.id.toLowerCase()
      )
    );
  }

  changeView(): void {
    this.showCards = !this.showCards;
    this._settings.selectProjectTableView = !this._settings.selectProjectTableView;
    this._settingsChange.emit();
  }

  selectProject(project: Project): void {
    this._projectService.selectProject(project);
  }

  selectDefaultProject(): void {
    if (
      !!this._settings &&
      !!this.projects &&
      !!this._settings.selectedProjectId &&
      this._previousRouteService.getPreviousUrl() === '/' &&
      this._previousRouteService.getHistory().length === 1
    ) {
      const defaultProject = this.projects.find(x => x.id === this._settings.selectedProjectId);
      this.selectProject(defaultProject);
    }
  }

  getOwnerNameArray(owners: ProjectOwners[]): string[] {
    const ownerNameArray = [];
    for (const i in owners) {
      if (Object.prototype.hasOwnProperty.call(owners, i)) {
        ownerNameArray.push(owners[i].name);
      }
    }
    return ownerNameArray;
  }

  getOwnerString(owners: ProjectOwners[]): string {
    return this.getOwnerNameArray(owners).join(', ');
  }

  getOwners(owners: ProjectOwners[]): string {
    return this.isMoreOwners(owners)
      ? this.getOwnerString(owners).substring(0, this._maxOwnersLen)
      : this.getOwnerString(owners);
  }

  isMoreOwners(owners: ProjectOwners[]): boolean {
    return this.getOwnerString(owners).length > this._maxOwnersLen;
  }

  getMoreOwnersCount(owners: ProjectOwners[]): number {
    return this.isMoreOwners(owners)
      ? owners.length - this.getOwnerString(owners).substring(0, this._maxOwnersLen).split(', ').length
      : 0;
  }

  getMoreOwners(owners: ProjectOwners[]): string {
    // truncatedLength = number of displayed owner names
    const truncatedLength = this.getOwnerString(owners).substring(0, this._maxOwnersLen).split(', ').length;
    // count = length of original owner names that are displayed
    // (truncatedLength - 1) * 2 = additional number of separators (', ' = 2)
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    let count = (truncatedLength - 1) * 2;
    for (let i = 0; i < truncatedLength; i++) {
      count += owners[i].name.length;
    }
    // if last displayed name is not complete, show it in tooltip
    return count > this._maxOwnersLen
      ? this.getOwnerNameArray(owners)
          .slice(truncatedLength - 1, owners.length)
          .join(', ')
      : this.getOwnerNameArray(owners).slice(truncatedLength, owners.length).join(', ');
  }

  getLabelsLength(project: Project): number {
    return project.labels ? Object.keys(project.labels).length : 0;
  }

  getLabelsTooltip(project: Project): string {
    let labels = '';
    let counter = 0;
    const labelLength = this.getLabelsLength(project);

    if (labelLength > 0) {
      for (const key in project.labels) {
        if (Object.prototype.hasOwnProperty.call(project.labels, key)) {
          counter++;
          if (project.labels[key]) {
            labels += `${key}: ${project.labels[key]}`;
          } else {
            labels += `${key}`;
          }

          if (counter < labelLength) {
            labels += ', ';
          }
        }
      }
    }
    return labels;
  }

  getName(name: string): string {
    const maxNameLen = 18;
    const truncatedNameLen = 15;
    return name.length > maxNameLen ? `${name.substring(0, truncatedNameLen)}...` : `${name}`;
  }

  getProjectTooltip(name: string): string {
    const maxNameLen = 18;
    return name.length > maxNameLen ? name : '';
  }

  isProjectActive(project: Project): boolean {
    return ProjectUtils.isProjectActive(project);
  }

  getProjectStateIconClass(project: Project): string {
    return ProjectUtils.getStateIconClass(project.status);
  }

  addProject(): void {
    this._matDialog
      .open(AddProjectDialogComponent)
      .afterClosed()
      .pipe(first())
      .subscribe(isAdded => {
        if (isAdded) {
          this._projectService.onProjectsUpdate.next();
        }
      });
  }

  isEditEnabled(project: Project): boolean {
    return MemberUtils.hasPermission(
      this.currentUser,
      this._userService.getCurrentUserGroupConfig(MemberUtils.getGroupInProject(this.currentUser, project.id)),
      View.Projects,
      Permission.Edit
    );
  }

  editProject(project: Project, event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(EditProjectComponent);
    modal.componentInstance.project = project;
    modal
      .afterClosed()
      .pipe(first())
      .subscribe(editedProject => {
        if (editedProject) {
          this._projectService.onProjectsUpdate.next();
        }
      });
  }

  isDeleteEnabled(project: Project): boolean {
    return MemberUtils.hasPermission(
      this.currentUser,
      this._userService.getCurrentUserGroupConfig(MemberUtils.getGroupInProject(this.currentUser, project.id)),
      View.Projects,
      Permission.Delete
    );
  }

  deleteProject(project: Project, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to permanently delete project "<strong>${project.name}</strong>"?`,
        confirmLabel: 'Delete',
        compareName: project.name,
        inputPlaceholder: 'Project Name',
        inputTitle: 'Project Name',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('projectOverview', 'deleteProjectOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._projectService.delete(project.id)))
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(`The <strong>${project.name}</strong> project is being deleted`);
        this._googleAnalyticsService.emitEvent('projectOverview', 'ProjectDeleted');
        this._projectService.onProjectsUpdate.next();
      });
  }

  private _shouldRedirectToCluster(): boolean {
    const autoredirect: boolean = this._cookieService.get(this._cookie.autoredirect) === 'true';
    this._cookieService.delete(this._cookie.autoredirect, '/');
    return this.projects.length === 1 && autoredirect;
  }

  private _redirectToCluster(): void {
    this._router.navigate([`/projects/${this.projects[0].id}/clusters`]);
  }

  private _isPaginatorVisible(): boolean {
    return !_.isEmpty(this.projects) && this.paginator && this.projects.length > this.paginator.pageSize;
  }
}
