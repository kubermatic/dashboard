import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort, MatSortHeader, SortDirection} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {MatPaginator} from "@angular/material/paginator";
import * as _ from 'lodash';
import {CookieService} from 'ngx-cookie-service';
import {Subject} from 'rxjs';
import {debounceTime, first, switchMap, takeUntil} from 'rxjs/operators';

import {Auth, ClusterService, ProjectService, UserService} from '../core/services';
import {PreviousRouteService} from '../core/services/previous-route/previous-route.service';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {AddProjectDialogComponent} from '../shared/components/add-project-dialog/add-project-dialog.component';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {UserSettings} from '../shared/entity/MemberEntity';
import {ProjectEntity, ProjectOwners} from '../shared/entity/ProjectEntity';
import {MemberUtils} from '../shared/utils/member-utils/member-utils';
import {ProjectUtils} from '../shared/utils/project-utils/project-utils';

import {EditProjectComponent} from './edit-project/edit-project.component';

@Component({
  selector: 'kubermatic-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})

export class ProjectComponent implements OnInit, OnChanges, OnDestroy {
  projects: ProjectEntity[] = [];
  isInitializing = true;
  clusterCount = [];
  role = [];
  rawRole = [];
  displayedColumns: string[] = ['status', 'name', 'labels', 'id', 'role', 'clusters', 'owners', 'actions'];
  dataSource = new MatTableDataSource<ProjectEntity>();
  showCards = true;
  isPaginatorVisible = false;

  paginator: MatPaginator;
  @ViewChild(MatPaginator, {static: false})
  set matPaginator(mp: MatPaginator) {
    const isViewInit = !this.paginator && !!mp;  // If true, view is being initialized.
    this.paginator = mp;
    this.dataSource.paginator = this.paginator;
    if (isViewInit) {
      setTimeout(() => {
        this.paginator.pageSize = this.settings.itemsPerPage;
        this.isPaginatorVisible = this.isPaginatorVisibleFn();
      }, 100);
    }
  }

  sort: MatSort;
  @ViewChild(MatSort)
  set matSort(ms: MatSort) {
    const isViewInit = !this.sort && !!ms;  // If true, view is being initialized.

    this.sort = ms;
    this.setDataSourceAttributes();

    if (isViewInit) {
      setTimeout(() => {
        // dirty hack to set sorting arrow:
        // use _handleClick() will trigger column's click event
        // therefor set initial sorting direction the opposite direciton
        this.sort.direction = 'desc' as SortDirection;
        const sortHeader = this.sort.sortables.get('name') as MatSortHeader;
        sortHeader._handleClick();
      }, 100);
    }
  }
  settings: UserSettings;
  private _settingsChange = new Subject<void>();
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _clusterService: ClusterService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _matDialog: MatDialog,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _router: Router,
      private readonly _cookieService: CookieService, private readonly _settingsService: SettingsService,
      private readonly _previousRouteService: PreviousRouteService) {}

  ngOnInit(): void {
    this.dataSource.data = this.projects;

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      if (this.settings) {
        return;
      }
      this.settings = settings;
      this.showCards = !settings.selectProjectTableView;
      this.selectDefaultProject();
    });

    this._settingsChange.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._settingsService.patchUserSettings({'selectProjectTableView': !this.showCards})))
        .subscribe(settings => {
          this.settings = settings;
          this.showCards = !settings.selectProjectTableView;
        });

    this._projectService.projects.pipe(takeUntil(this._unsubscribe)).subscribe(projects => {
      this.projects = projects;
      this.dataSource.data = this.projects;
      this._sortProjectOwners();
      this._loadClusterCounts();
      this._loadCurrentUserRoles();

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

  private _loadClusterCounts(): void {
    this.projects.forEach(project => {
      if (project.status === 'Active') {
        this._clusterService.clusters(project.id).pipe(first()).subscribe((dcClusters) => {
          this.clusterCount[project.id] = dcClusters.length;
        });
      }
    });
  }

  private _loadCurrentUserRoles(): void {
    this.projects.forEach(project => {
      this._userService.currentUserGroup(project.id).subscribe((group) => {
        this.role[project.id] = MemberUtils.getGroupDisplayName(group);
        this.rawRole[project.id] = group;
      });
    });
  }

  changeView(): void {
    this.showCards = !this.showCards;
    this.settings.selectProjectTableView = !this.settings.selectProjectTableView;
    this._settingsChange.next();
  }

  selectProject(project: ProjectEntity): void {
    this._projectService.selectProject(project);
  }

  selectDefaultProject(): void {
    if (!!this.settings && !!this.projects && !!this.settings.selectedProjectId &&
        this._previousRouteService.getPreviousUrl() === '/' && this._previousRouteService.getHistory().length === 1) {
      const defaultProject = this.projects.find((x) => x.id === this.settings.selectedProjectId);
      this.selectProject(defaultProject);
    }
  }

  getOwnerNameArray(owners: ProjectOwners[]): string[] {
    const ownerNameArray = [];
    for (const i in owners) {
      if (owners.hasOwnProperty(i)) {
        ownerNameArray.push(owners[i].name);
      }
    }
    return ownerNameArray;
  }

  getOwnerString(owners: ProjectOwners[]): string {
    return this.getOwnerNameArray(owners).join(', ');
  }

  getOwners(owners: ProjectOwners[]): string {
    return this.isMoreOwners(owners) ? (this.getOwnerString(owners).substring(0, 30)) : this.getOwnerString(owners);
  }

  isMoreOwners(owners: ProjectOwners[]): boolean {
    return this.getOwnerString(owners).length > 30;
  }

  getMoreOwnersCount(owners: ProjectOwners[]): number {
    return this.isMoreOwners(owners) ?
        (owners.length - this.getOwnerString(owners).substring(0, 30).split(', ').length) :
        0;
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
    return count > 30 ? this.getOwnerNameArray(owners).slice(truncatedLength - 1, owners.length).join(', ') :
                        this.getOwnerNameArray(owners).slice(truncatedLength, owners.length).join(', ');
  }

  getLabelsLength(project: ProjectEntity): number {
    return project.labels ? Object.keys(project.labels).length : 0;
  }

  getLabelsTooltip(project: ProjectEntity): string {
    let labels = '';
    let counter = 0;
    const labelLength = this.getLabelsLength(project);

    if (labelLength > 0) {
      for (const key in project.labels) {
        if (project.labels.hasOwnProperty(key)) {
          counter++;
          if (project.labels[key]) {
            labels += `${key}: ${project.labels[key]}`;
          } else {
            labels += `${key}`;
          }

          if (counter < labelLength) {
            labels += `, `;
          }
        }
      }
    }
    return labels;
  }

  getName(name: string): string {
    return name.length > 19 ? `${name.substring(0, 15)}...` : `${name}`;
  }

  getProjectTooltip(name: string): string {
    return name.length > 19 ? name : '';
  }

  isProjectActive(project: ProjectEntity): boolean {
    return ProjectUtils.isProjectActive(project);
  }

  getProjectStateIconClass(project: ProjectEntity): string {
    return ProjectUtils.getStateIconClass(project.status);
  }

  addProject(): void {
    this._matDialog.open(AddProjectDialogComponent).afterClosed().pipe(first()).subscribe((isAdded) => {
      if (isAdded) {
        this._projectService.onProjectsUpdate.next();
      }
    });
  }

  isEditEnabled(project: ProjectEntity): boolean {
    return !this._userService.userGroupConfig(this.rawRole[project.id]) ||
        this._userService.userGroupConfig(this.rawRole[project.id]).projects.edit;
  }

  editProject(project: ProjectEntity, event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(EditProjectComponent);
    modal.componentInstance.project = project;
    modal.afterClosed().pipe(first()).subscribe((editedProject) => {
      if (editedProject) {
        this._projectService.onProjectsUpdate.next();
      }
    });
  }

  isDeleteEnabled(project: ProjectEntity): boolean {
    return !this._userService.userGroupConfig(this.rawRole[project.id]) ||
        this._userService.userGroupConfig(this.rawRole[project.id]).projects.delete;
  }

  deleteProject(project: ProjectEntity, event: Event): void {
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

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._projectService.delete(project.id).subscribe(() => {
          NotificationActions.success(`Project ${project.name} is being deleted`);
          this._googleAnalyticsService.emitEvent('projectOverview', 'ProjectDeleted');
          this._projectService.onProjectsUpdate.next();
        });
      }
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

  hasItems(): boolean {
    return this.projects && this.projects.length > 0;
  }

  isPaginatorVisibleFn(): boolean {
    return this.hasItems() && this.paginator && this.projects.length > this.paginator.pageSize;
  }
}
