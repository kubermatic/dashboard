import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {merge, Subject, timer} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {AddProjectDialogComponent} from '../shared/components/add-project-dialog/add-project-dialog.component';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ProjectEntity, ProjectOwners} from '../shared/entity/ProjectEntity';
import {MemberUtils} from '../shared/utils/member-utils/member-utils';
import {ProjectUtils} from '../shared/utils/project-utils/project-utils';

import {EditProjectComponent} from './edit-project/edit-project.component';

@Component({
  selector: 'kubermatic-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})

export class ProjectComponent implements OnInit, OnDestroy {
  projects: ProjectEntity[] = [];
  isInitializing = true;
  clusterCount = [];
  role = [];
  rawRole = [];
  displayedColumns: string[] = ['status', 'name', 'id', 'role', 'clusters', 'owners', 'actions'];
  dataSource = new MatTableDataSource<ProjectEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();
  private _externalProjectsUpdate: Subject<any> = new Subject();

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _matDialog: MatDialog,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _appConfig: AppConfigService) {
  }

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    merge(timer(0, 10 * this._appConfig.getRefreshTimeBase()), this._externalProjectsUpdate)
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._apiService.getProjects()))
        .subscribe(projects => {
          this.projects = projects;
          this._sortProjectOwners();
          this._loadClusterCounts();
          this._loadCurrentUserRoles();
          this.isInitializing = false;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<ProjectEntity> {
    this.dataSource.data = this.projects;
    return this.dataSource;
  }

  private _sortProjectOwners(): void {
    this.projects.forEach(project => {
      project.owners = project.owners.sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  private _loadClusterCounts(): void {
    this.projects.forEach(project => {
      if (project.status === 'Active') {
        this._apiService.getAllClusters(project.id).pipe(first()).subscribe((dcClusters) => {
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

  async selectProject(project: ProjectEntity): Promise<any> {
    if (this.isProjectActive(project)) {
      await this._projectService.changeAndStoreSelectedProject(project, false);
      if (this._projectService.isViewEnabled('clusters')) {
        this._projectService.navigateToClusterPage();
      }
    }
  }

  getOwnerArray(owners: ProjectOwners[]): string {
    const ownerArray = [];
    for (const i in owners) {
      if (owners.hasOwnProperty(i)) {
        ownerArray.push(owners[i].name);
      }
    }
    return ownerArray.join(', ');
  }

  isMoreOwners(owners: ProjectOwners[]): boolean {
    return this.getOwnerArray(owners).length > 30;
  }

  getMoreOwnersCount(owners: ProjectOwners[]): number {
    return this.isMoreOwners(owners) ?
        (owners.length - this.getOwnerArray(owners).substring(0, 30).split(', ').length) :
        0;
  }

  getOwners(owners: ProjectOwners[]): string {
    return this.isMoreOwners(owners) ? (this.getOwnerArray(owners).substring(0, 30)) : this.getOwnerArray(owners);
  }

  getMoreOwners(owners: ProjectOwners[]): string {
    return this.getOwnerArray(owners).substring(30, this.getOwnerArray(owners).length);
  }


  isProjectActive(project: ProjectEntity) {
    return ProjectUtils.isProjectActive(project);
  }

  getProjectStateIconClass(project: ProjectEntity): string {
    return ProjectUtils.getStateIconClass(project.status);
  }

  addProject(): void {
    this._matDialog.open(AddProjectDialogComponent).afterClosed().pipe(first()).subscribe((isAdded) => {
      if (isAdded) {
        this._externalProjectsUpdate.next();
      }
    });
  }

  isEditEnabled(project: ProjectEntity): boolean {
    return !this._projectService.getUserGroupConfig(this.rawRole[project.id]) ||
        this._projectService.getUserGroupConfig(this.rawRole[project.id]).projects.edit;
  }

  editProject(project: ProjectEntity, event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(EditProjectComponent);
    modal.componentInstance.project = project;
    modal.afterClosed().pipe(first()).subscribe((editedProject) => {
      if (editedProject) {
        this._externalProjectsUpdate.next();
      }
    });
  }

  isDeleteEnabled(project: ProjectEntity): boolean {
    return !this._projectService.getUserGroupConfig(this.rawRole[project.id]) ||
        this._projectService.getUserGroupConfig(this.rawRole[project.id]).projects.delete;
  }

  deleteProject(project: ProjectEntity, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to permanently delete project ${project.name}?`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
        compareName: project.name,
        inputPlaceholder: 'Project name',
        inputTitle: 'Project name',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('projectOverview', 'deleteProjectOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService.deleteProject(project.id).subscribe(() => {
          NotificationActions.success('Success', `Project ${project.name} is being deleted`);
          this._googleAnalyticsService.emitEvent('projectOverview', 'ProjectDeleted');

          if (project.id === this._projectService.getCurrentProjectId()) {
            this._projectService.deselectProject();
          }

          this._externalProjectsUpdate.next();
        });
      }
    });
  }
}
