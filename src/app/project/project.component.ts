import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {interval, Subscription} from 'rxjs';
import {first} from 'rxjs/operators';

import {AddProjectComponent} from '../add-project/add-project.component';
import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../shared/model/Config';

import {EditProjectComponent} from './edit-project/edit-project.component';

@Component({
  selector: 'kubermatic-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss'],
})

export class ProjectComponent implements OnInit, OnDestroy {
  projects: ProjectEntity[] = [];
  loading = true;
  currentProject: ProjectEntity;
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  clusterCount = [];
  role = [];
  clickedEditProject = {};
  clickedDeleteProject = {};
  displayedColumns: string[] = ['status', 'name', 'id', 'role', 'clusters', 'owners', 'actions'];
  dataSource = new MatTableDataSource<ProjectEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private subscriptions: Subscription[] = [];

  constructor(
      private api: ApiService, private appConfigService: AppConfigService, private projectService: ProjectService,
      private userService: UserService, public dialog: MatDialog,
      private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();

    this.currentProject = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.currentProject = project;
      this.userService.currentUserGroup(this.currentProject.id).subscribe((group) => {
        this.userGroup = group;
      });
    }));

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    const timer = interval(10000);
    this.subscriptions.push(timer.subscribe(() => {
      this.refreshProjects();
    }));
    this.refreshProjects();
  }

  getDataSource(): MatTableDataSource<ProjectEntity> {
    this.dataSource.data = this.projects;
    return this.dataSource;
  }

  refreshProjects(): void {
    this.subscriptions.push(this.api.getProjects().subscribe((res) => {
      this.projects = res;
      for (const i in res) {
        if (res.hasOwnProperty(i)) {
          this.projects[i].owners = res[i].owners.sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });
        }
      }
      this.getClusterCount();
      this.getRole();
      this.loading = false;
    }));
  }

  selectProject(project: ProjectEntity): void {
    if (!this.clickedDeleteProject[project.id] && !this.clickedEditProject[project.id]) {
      this.projectService.changeAndStoreSelectedProject(project);
    }
  }

  getRole(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    for (const project of this.projects) {
      this.userService.currentUserGroup(project.id).subscribe((group) => {
        switch (group) {
          case 'owners':
            return this.role[project.id] = 'Owner';
          case 'editors':
            return this.role[project.id] = 'Editor';
          case 'viewers':
            return this.role[project.id] = 'Viewer';
          default:
            return this.role[project.id] = '';
        }
      });
    }
  }

  getClusterCount(): void {
    for (const project of this.projects) {
      if (project.status === 'Active') {
        this.api.getAllClusters(project.id).pipe(first()).subscribe((dcClusters) => {
          this.clusterCount[project.id] = dcClusters.length;
        });
      }
    }
  }

  addProject(): void {
    const modal = this.dialog.open(AddProjectComponent);
    const sub = modal.afterClosed().subscribe((added) => {
      if (added) {
        this.refreshProjects();
      }
      sub.unsubscribe();
    });
  }

  editProject(project: ProjectEntity): void {
    this.clickedEditProject[project.id] = true;
    const modal = this.dialog.open(EditProjectComponent);
    modal.componentInstance.project = project;
    const sub = modal.afterClosed().subscribe((edited) => {
      if (!!edited) {
        this.projectService.changeAndStoreSelectedProject(edited);
      }
      delete this.clickedEditProject[project.id];
      sub.unsubscribe();
    });
  }

  deleteProject(project: ProjectEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Project',
        message: `You are on the way to delete the project ${
            project
                .name}. Deletion of projects cannot be undone! If you know what you are doing, please type the name of the project:`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
        compareName: project.name,
        inputPlaceholder: 'Name of the Project:',
        inputTitle: 'Project name',
      },
    };

    this.clickedDeleteProject[project.id] = true;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('projectOverview', 'deleteProjectOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteProject(project.id).subscribe(() => {
          NotificationActions.success('Success', `Project ${project.name} is being deleted`);
          this.googleAnalyticsService.emitEvent('projectOverview', 'ProjectDeleted');

          if (project.id === this.currentProject.id) {
            this.projectService.changeSelectedProject({
              id: '',
              name: '',
              creationTimestamp: null,
              deletionTimestamp: null,
              status: '',
              owners: [],
            });
            this.projectService.removeProject();
          }

          delete this.clickedDeleteProject[project.id];
          setTimeout(() => {
            this.projectService.navigateToProjectPage();
          });
        });
      }
    });
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
