import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import * as _ from 'lodash';
import {CookieService} from 'ngx-cookie-service';
import {Subject, timer} from 'rxjs';
import {debounceTime, filter, first, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../app-config.service';
import {Auth, NotificationService, ProjectService, UserService} from '../core/services';
import {PreviousRouteService} from '../core/services/previous-route/previous-route.service';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {AddProjectDialogComponent} from '../shared/components/add-project-dialog/add-project-dialog.component';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {Project, ProjectOwners} from '../shared/entity/project';
import {MemberUtils, Permission} from '../shared/utils/member-utils/member-utils';
import {ProjectUtils} from '../shared/utils/project-utils/project-utils';

import {EditProjectComponent} from './edit-project/edit-project.component';
import {Member} from '../shared/entity/member';
import {UserSettings} from '../shared/entity/settings';

@Component({
  selector: 'km-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit, OnChanges, OnDestroy {
  projects: Project[] = [];
  currentUser: Member;
  isInitializing = true;
  role = [];
  rawRole = [];
  displayedColumns: string[] = ['status', 'name', 'labels', 'id', 'role', 'clusters', 'owners', 'actions'];
  dataSource = new MatTableDataSource<Project>();
  isPaginatorVisible = false;
  showCards = true;

  paginator: MatPaginator;

  @ViewChild(MatPaginator)
  set matPaginator(mp: MatPaginator) {
    this.paginator = mp;

    setTimeout(_ => {
      if (this.paginator && this.settings) {
        this.paginator.pageSize = this.settings.itemsPerPage;
        this.isPaginatorVisible = this._isPaginatorVisible();
      }
    });

    this.dataSource.paginator = this.paginator;
  }

  sort: MatSort;

  @ViewChild(MatSort)
  set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  settings: UserSettings;
  private _settingsChange = new Subject<void>();
  private _unsubscribe: Subject<any> = new Subject();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _matDialog: MatDialog,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _router: Router,
    private readonly _cookieService: CookieService,
    private readonly _settingsService: SettingsService,
    private readonly _notificationService: NotificationService,
    private readonly _previousRouteService: PreviousRouteService,
    private readonly _appConfig: AppConfigService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.projects;

    this._userService.loggedInUser.subscribe(user => (this.currentUser = user));

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (this.settings) {
        return;
      }
      this.settings = settings;
      this.showCards = !settings.selectProjectTableView;
      this.selectDefaultProject();
    });

    this._settingsChange
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap(() =>
          this._settingsService.patchUserSettings({
            selectProjectTableView: !this.showCards,
          } as UserSettings)
        )
      )
      .subscribe(settings => {
        this.settings = settings;
        this.showCards = !settings.selectProjectTableView;
      });

    this._refreshTimer$
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(() => this._projectService.projects))
      .subscribe(projects => {
        this.projects = this._loadCurrentUserRolesAndSortProjects(projects);
        this.dataSource.data = this.projects;
        this._sortProjectOwners();

        if (this._shouldRedirectToCluster()) {
          this._redirectToCluster();
        }
        this.isInitializing = false;
        this.selectDefaultProject();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngOnChanges(): void {
    this.dataSource.data = this.projects;
  }

  setDataSourceAttributes(): void {
    this.dataSource.sort = this.sort;
  }

  private _sortProjectOwners(): void {
    this.projects.forEach(project => {
      project.owners = project.owners.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  private _loadCurrentUserRolesAndSortProjects(projects): Project[] {
    const ownProjects: Project[] = [];
    const externalProjects: Project[] = [];
    projects.forEach(project => {
      this._userService.currentUserGroup(project.id).subscribe(group => {
        this.role[project.id] = MemberUtils.getGroupDisplayName(group);
        this.rawRole[project.id] = group;
        if (MemberUtils.getGroupDisplayName(group) !== '') {
          ownProjects.push(project);
        } else {
          externalProjects.push(project);
        }
      });
    });

    return ownProjects
      .sort((a, b) => (a.name + a.id).localeCompare(b.name + b.id))
      .concat(externalProjects.sort((a, b) => (a.name + a.id).localeCompare(b.name + b.id)));
  }

  changeView(): void {
    this.showCards = !this.showCards;
    this.settings.selectProjectTableView = !this.settings.selectProjectTableView;
    this._settingsChange.next();
  }

  selectProject(project: Project): void {
    this._projectService.selectProject(project);
  }

  selectDefaultProject(): void {
    if (
      !!this.settings &&
      !!this.projects &&
      !!this.settings.selectedProjectId &&
      this._previousRouteService.getPreviousUrl() === '/' &&
      this._previousRouteService.getHistory().length === 1
    ) {
      const defaultProject = this.projects.find(x => x.id === this.settings.selectedProjectId);
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
    return this.isMoreOwners(owners) ? this.getOwnerString(owners).substring(0, 30) : this.getOwnerString(owners);
  }

  isMoreOwners(owners: ProjectOwners[]): boolean {
    return this.getOwnerString(owners).length > 30;
  }

  getMoreOwnersCount(owners: ProjectOwners[]): number {
    return this.isMoreOwners(owners)
      ? owners.length - this.getOwnerString(owners).substring(0, 30).split(', ').length
      : 0;
  }

  getMoreOwners(owners: ProjectOwners[]): string {
    // truncatedLength = number of displayed owner names
    const truncatedLength = this.getOwnerString(owners).substring(0, 30).split(', ').length;
    // count = length of original owner names that are displayed
    // (truncatedLength - 1) * 2 = additional number of seperators (', ' = 2)
    let count: number = (truncatedLength - 1) * 2;
    for (let i = 0; i < truncatedLength; i++) {
      count += owners[i].name.length;
    }
    // if last displayed name is not complete, show it in tooltip
    return count > 30
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
    return name.length > 18 ? `${name.substring(0, 15)}...` : `${name}`;
  }

  getProjectTooltip(name: string): string {
    return name.length > 18 ? name : '';
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
      this._userService.userGroupConfig(this.rawRole[project.id]),
      'projects',
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
      this._userService.userGroupConfig(this.rawRole[project.id]),
      'projects',
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
    const autoredirect: boolean = this._cookieService.get(Auth.Cookie.Autoredirect) === 'true';
    this._cookieService.delete(Auth.Cookie.Autoredirect, '/');
    return this.projects.length === 1 && autoredirect;
  }

  private _redirectToCluster(): void {
    this._router.navigate([`/projects/${this.projects[0].id}/clusters`]);
  }

  private _isPaginatorVisible(): boolean {
    return !_.isEmpty(this.projects) && this.paginator && this.projects.length > this.paginator.pageSize;
  }
}
