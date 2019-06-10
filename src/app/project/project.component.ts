import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';
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
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _matDialog: MatDialog,
      private readonly _googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._projectService.projects.pipe(takeUntil(this._unsubscribe)).subscribe(projects => {
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

  selectProject(project: ProjectEntity) {
    this._projectService.selectProject(project);
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


  isProjectActive(project: ProjectEntity) {
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
        message: `Are you sure you want to permanently delete project ${project.name}?`,
        confirmLabel: 'Delete',
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
          this._projectService.onProjectsUpdate.next();
        });
      }
    });
  }
}
