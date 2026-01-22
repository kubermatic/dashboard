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
import {MatDialog} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {COOKIE_DI_TOKEN, Cookie} from '@app/config';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {DynamicModule} from '@app/dynamic/module-registry';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ClusterService} from '@core/services/cluster';
import {GlobalModule} from '@core/services/global/module';
import {NotificationService} from '@core/services/notification';
import {PreviousRouteService} from '@core/services/previous-route';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {AddProjectDialogComponent} from '@shared/components/add-project-dialog/component';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project, ProjectOwner, ProjectStatus} from '@shared/entity/project';
import {AllowedOperatingSystems, UserSettings} from '@shared/entity/settings';
import {getEditionVersion, objectDiff} from '@shared/utils/common';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {CookieService} from 'ngx-cookie-service';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {QuotaWidgetComponent} from '../dynamic/enterprise/quotas/quota-widget/component';
import {QuotaService} from '../dynamic/enterprise/quotas/service';
import {DeleteProjectConfirmationComponent} from './delete-project/component';
import {EditProjectComponent} from './edit-project/component';

@Component({
  selector: 'km-project',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProjectComponent implements OnInit, OnChanges, OnDestroy {
  readonly ProjectStatus = ProjectStatus;

  projects: Project[] = [];
  currentUser: Member;
  isInitializing = true;
  role = new Map<string, string>();
  displayedColumns: string[] = ['status', 'name', 'labels', 'id', 'role', 'clusters', 'owners'];
  dataSource = new MatTableDataSource<Project>();
  isPaginatorVisible = false;
  showCards = true;
  settings: UserSettings;
  restrictProjectCreation = false;
  restrictProjectDeletion = false;
  restrictProjectModification = false;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  hasQuota: boolean;
  isProjectsLoading: boolean;
  editionVersion: string = getEditionVersion();
  allowedOperatingSystems: AllowedOperatingSystems;

  private _clusterSearchCache = new Map<string, string[]>();
  private _clusterSearchInFlight = new Set<string>();
  private readonly _maxOwnersLen = 30;
  private _apiSettings: UserSettings;
  private _quotaService: QuotaService;
  private _settingsChange = new EventEmitter<void>();
  private _unsubscribe: Subject<void> = new Subject<void>();

  get isAdmin(): boolean {
    return !!this.currentUser && this.currentUser.isAdmin;
  }

  paginator: MatPaginator;

  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    this.paginator = mp;

    if (this.paginator && this.settings) {
      this.paginator.pageSize = this.settings.itemsPerPage;
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
    private readonly _clusterService: ClusterService,
    private readonly _settingsService: SettingsService,
    @Inject(COOKIE_DI_TOKEN) private readonly _cookie: Cookie,
    private readonly _dialogModeService: DialogModeService
  ) {
    if (this.isEnterpriseEdition) {
      this._quotaService = GlobalModule.injector.get(QuotaService);
    }
  }

  ngOnInit(): void {
    this.dataSource.data = this.projects;
    this.dataSource.filterPredicate = this._filter.bind(this);
    this.dataSource.filter = '';
    this.dataSource.sortData = (data: Project[], sort: MatSort) => {
      if (!sort.active || sort.direction === '') {
        return data;
      }

      return data.sort((a: Project, b: Project) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return this.compare(a.name, b.name, isAsc);
          case 'id':
            return this.compare(a.id, b.id, isAsc);
          case 'role':
            return this.compare(this.getRole(a.id), this.getRole(b.id), isAsc);
          case 'clusters':
            return this.compare(a.clustersNumber || 0, b.clustersNumber || 0, isAsc);
          default:
            return 0;
        }
      });
    };

    this._userService.currentUser.subscribe(user => {
      this.currentUser = user;
      this._loadCurrentUserRoles();
    });

    this._userService.currentUserSettings
      .pipe(
        tap(settings => {
          this._apiSettings = settings;
          this.settings = _.cloneDeep(this._apiSettings);
          this.showCards = !settings.selectProjectTableView;
        })
      )
      .pipe(filter(_ => !this.settings))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.selectDefaultProject());

    this._settingsChange
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(() => this._userService.patchCurrentUserSettings(objectDiff(this.settings, this._apiSettings))))
      .subscribe(settings => {
        this._apiSettings = settings;
        this.settings = _.cloneDeep(this._apiSettings);
      });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.restrictProjectCreation = settings.restrictProjectCreation;
      this.restrictProjectDeletion = settings.restrictProjectDeletion;
      this.restrictProjectModification = settings.restrictProjectModification;
      this.allowedOperatingSystems = settings.allowedOperatingSystems;
    });

    this._projectService.projects.pipe(takeUntil(this._unsubscribe)).subscribe((projects: Project[]) => {
      this.projects = this._sortProjects(projects);
      this._loadCurrentUserRoles();
      this._sortProjectOwners();
      this._purgeClusterSearchCache();
      this.dataSource.data = this.projects;

      if (this._shouldRedirectToProjectLandingPage()) {
        this._redirectToProjectLandingPage();
      }
      this.verifyQuotas(this.projects);
      this.isInitializing = false;
      this.selectDefaultProject();
      this.isProjectsLoading = false;
      this._cdr.detectChanges();
    });

    this._setDisplayedColumns();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngOnChanges(): void {
    this.dataSource.data = this.projects;
    this._cdr.detectChanges();
  }

  projectTrackBy(_: number, project: Project): string {
    return project.id;
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  isEmpty(arr: any): boolean {
    return _.isEmpty(arr) && !this.isInitializing;
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;

    if (query?.trim()) {
      this._primeClusterSearchIndex();
    }
  }

  verifyQuotas(projects: Project[]): void {
    this.hasQuota = false;

    if (!this.isEnterpriseEdition) {
      return;
    }
    if (this.currentUser?.isAdmin) {
      this._quotaService.quotas
        .pipe(take(1))
        .pipe(filter(quotas => !!quotas?.find(quotaDetails => !_.isEmpty(quotaDetails?.quota))))
        .subscribe(_ => {
          this.hasQuota = true;
          this._cdr.detectChanges();
        });
    } else {
      for (const project of projects) {
        if (project.status === ProjectStatus.Active) {
          this._quotaService
            .getLiveProjectQuota(project.id)
            .pipe(take(1))
            .pipe(filter(quotaDetails => !_.isEmpty(quotaDetails?.quota)))
            .subscribe(_ => {
              this.hasQuota = true;
              this._cdr.detectChanges();
            });
        }
      }
    }
  }

  getNumberOfLabels(labels: object): number {
    if (labels) {
      return Object.keys(labels).length;
    }
    return 0;
  }

  private _filter(project: Project, query: string): boolean {
    query = query.toLowerCase();

    // Check name.
    if (project.name.toLowerCase().includes(query)) {
      return true;
    }

    // Check ID.
    if (project.id.toLowerCase().includes(query)) {
      return true;
    }

    // Check owner names.
    let hasMatchingOwner = false;
    if (project.owners) {
      project.owners.forEach(owner => {
        if (owner.name && owner.name.toLowerCase().includes(query)) {
          hasMatchingOwner = true;
          return;
        }
      });
      if (hasMatchingOwner) {
        return true;
      }
    }

    // Check labels.
    if (project.labels) {
      let hasMatchingLabel = false;
      Object.keys(project.labels).forEach(key => {
        const value = project.labels[key];
        if (key.toLowerCase().includes(query) || value.toLowerCase().includes(query)) {
          hasMatchingLabel = true;
          return;
        }
      });
      if (hasMatchingLabel) {
        return true;
      }
    }

    // Check cluster names and IDs (loaded on-demand).
    const clusterIdentifiers = this._clusterSearchCache.get(project.id);
    if (clusterIdentifiers?.some(identifier => identifier.includes(query))) {
      return true;
    }

    return false;
  }

  private _loadCurrentUserRoles(): void {
    if (!!this.currentUser && !!this.currentUser.projects) {
      this.currentUser.projects.forEach(mp => this.role.set(mp.id, MemberUtils.getGroupDisplayName(mp.group)));
    }

    if (!!this.projects && !!this.currentUser) {
      this.projects
        .filter(p => (p.owners ? p.owners.map(o => o.email).includes(this.currentUser.email) : false))
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

  private _primeClusterSearchIndex(): void {
    if (!this.projects?.length) {
      return;
    }

    this.projects.forEach(project => {
      if (this._clusterSearchCache.has(project.id) || this._clusterSearchInFlight.has(project.id)) {
        return;
      }

      this._clusterSearchInFlight.add(project.id);
      this._clusterService
        .clusters(project.id)
        .pipe(take(1))
        .subscribe(
          clusters => {
            const identifiers: string[] = [];
            (clusters || []).forEach(cluster => {
              if (cluster.name) {
                identifiers.push(cluster.name.toLowerCase());
              }
              if (cluster.id) {
                identifiers.push(cluster.id.toLowerCase());
              }
            });
            this._clusterSearchCache.set(project.id, identifiers);
            this._clusterSearchInFlight.delete(project.id);
            const currentFilter = this.dataSource.filter;
            this.dataSource.filter = currentFilter || '';
            this._cdr.detectChanges();
          },
          () => {
            this._clusterSearchInFlight.delete(project.id);
          }
        );
    });
  }

  private _purgeClusterSearchCache(): void {
    const projectIDs = new Set(this.projects.map(project => project.id));
    for (const projectID of this._clusterSearchCache.keys()) {
      if (!projectIDs.has(projectID)) {
        this._clusterSearchCache.delete(projectID);
      }
    }
  }

  changeView(): void {
    this.showCards = !this.showCards;
    this.settings.selectProjectTableView = !this.settings.selectProjectTableView;
    this._settingsChange.emit();
  }

  changeProjectVisibility(): void {
    this.settings.displayAllProjectsForAdmin = !this.settings.displayAllProjectsForAdmin;
    this.isProjectsLoading = true;
    this._settingsChange.emit();
  }

  selectProject(project: Project): void {
    this._projectService.selectProject(project);
  }

  selectDefaultProject(): void {
    if (
      !!this.settings &&
      !!this.projects &&
      !!this.settings.selectedProjectID &&
      this._previousRouteService.getPreviousUrl() === '/' &&
      this._previousRouteService.getHistory().length === 1
    ) {
      const defaultProject = this.projects.find(x => x.id === this.settings.selectedProjectID);
      this.selectProject(defaultProject);
    }
  }

  getOwnerNameArray(owners: ProjectOwner[]): string[] {
    const ownerNameArray = [];
    for (const i in owners) {
      if (Object.prototype.hasOwnProperty.call(owners, i)) {
        ownerNameArray.push(owners[i].name);
      }
    }
    return ownerNameArray;
  }

  getOwnerString(owners: ProjectOwner[]): string {
    return this.getOwnerNameArray(owners).join(', ');
  }

  getOwners(owners: ProjectOwner[]): string {
    return this.isMoreOwners(owners)
      ? this.getOwnerString(owners).substring(0, this._maxOwnersLen)
      : this.getOwnerString(owners);
  }

  isMoreOwners(owners: ProjectOwner[]): boolean {
    return this.getOwnerString(owners).length > this._maxOwnersLen;
  }

  getMoreOwnersCount(owners: ProjectOwner[]): number {
    return this.isMoreOwners(owners)
      ? owners.length - this.getOwnerString(owners).substring(0, this._maxOwnersLen).split(', ').length
      : 0;
  }

  getMoreOwners(owners: ProjectOwner[]): string {
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
    return project?.status === ProjectStatus.Active;
  }

  getStatusIcon(project: Project): string {
    return Project.getStatusIcon(project);
  }

  isProjectCreationRestricted(): boolean {
    return !this.isAdmin && !!this.restrictProjectCreation;
  }

  addProject(): void {
    const modal = this._matDialog.open(AddProjectDialogComponent);
    modal.componentInstance.adminAllowedOperatingSystems = this.allowedOperatingSystems;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(isAdded => {
        if (isAdded) {
          this._projectService.onProjectsUpdate.next();
          this.projects.push(isAdded);
        }
      });
  }

  isEditEnabled(project: Project): boolean {
    if (this.restrictProjectModification) {
      return this.currentUser.isAdmin;
    }
    return (
      MemberUtils.hasPermission(
        this.currentUser,
        this._userService.getCurrentUserGroupConfig(MemberUtils.getGroupInProject(this.currentUser, project.id)),
        View.Projects,
        Permission.Edit
      ) && project.status !== ProjectStatus.Terminating
    );
  }

  editProject(project: Project, event: Event): void {
    event.stopPropagation();
    this._dialogModeService.isEditDialog = true;
    const modal = this._matDialog.open(EditProjectComponent);
    modal.componentInstance.project = project;
    modal.componentInstance.adminAllowedOperatingSystems = this.allowedOperatingSystems;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(editedProject => {
        if (editedProject) {
          this._projectService.onProjectsUpdate.next();
        }
      });
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  isDeleteEnabled(project: Project): boolean {
    if (this.restrictProjectDeletion) {
      return this.currentUser.isAdmin;
    }
    return (
      MemberUtils.hasPermission(
        this.currentUser,
        this._userService.getCurrentUserGroupConfig(MemberUtils.getGroupInProject(this.currentUser, project.id)),
        View.Projects,
        Permission.Delete
      ) && project.status !== ProjectStatus.Terminating
    );
  }

  deleteProject(project: Project, event: Event): void {
    event.stopPropagation();
    const dialogRef = this._matDialog.open(DeleteProjectConfirmationComponent);
    dialogRef.componentInstance.project = project;
    this._googleAnalyticsService.emitEvent('projectOverview', 'deleteProjectOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._projectService.delete(project.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(`Deleting the ${project.name} project`);
        this._googleAnalyticsService.emitEvent('projectOverview', 'ProjectDeleted');
        this._projectService.onProjectsUpdate.next();
      });
  }

  onActivate(component: QuotaWidgetComponent, projectId: string, projectViewType?: string): void {
    component.projectId = projectId;
    component.showIcon = this.showCards;
    component.showAsCard = false;
    component.showDetailsOnHover = true;
    component.showBorderOutline = false;
    component.projectViewType = projectViewType;
  }

  private _setDisplayedColumns(): void {
    if (this.isEnterpriseEdition) {
      this.displayedColumns = [...this.displayedColumns, 'quota', 'actions'];
    } else {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }
  }

  private _shouldRedirectToProjectLandingPage(): boolean {
    const autoredirect: boolean = this._cookieService.get(this._cookie.autoredirect) === 'true';
    this._cookieService.delete(this._cookie.autoredirect, '/');
    return this.projects.length === 1 && autoredirect;
  }

  private _redirectToProjectLandingPage(): void {
    const projectLandingPage = this._apiSettings.useClustersView ? View.Clusters : View.Overview;
    this._router.navigateByUrl(`/projects/${this.projects[0].id}/${projectLandingPage}`);
  }

  private _isPaginatorVisible(): boolean {
    return !_.isEmpty(this.projects) && this.paginator && this.projects.length > this.paginator.pageSize;
  }
}
