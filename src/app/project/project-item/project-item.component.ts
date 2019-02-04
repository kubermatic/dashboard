import {Component, Input, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {AppConfigService} from '../../app-config.service';
import {ApiService, ProjectService, UserService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../../shared/model/Config';
import {EditProjectComponent} from '../edit-project/edit-project.component';

@Component({
  selector: 'kubermatic-project-item',
  templateUrl: './project-item.component.html',
  styleUrls: ['./project-item.component.scss'],
})
export class ProjectItemComponent implements OnInit {
  @Input() index: number;
  @Input() project: ProjectEntity;
  clickedDeleteProject = {};
  clickedEditProject = {};
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  constructor(
      public dialog: MatDialog, public projectService: ProjectService, private userService: UserService,
      private appConfigService: AppConfigService, private api: ApiService,
      private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.project.id).subscribe((group) => {
      this.userGroup = group;
    });
  }

  getProjectItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'km-odd';
    }
  }

  selectProject(): void {
    if (!this.clickedDeleteProject[this.project.id] && !this.clickedEditProject[this.project.id]) {
      this.projectService.changeAndStoreSelectedProject(this.project);
    }
  }

  editProject(): void {
    this.clickedEditProject[this.project.id] = true;
    const modal = this.dialog.open(EditProjectComponent);
    modal.componentInstance.project = this.project;
    const sub = modal.afterClosed().subscribe((edited) => {
      if (!!edited) {
        this.projectService.changeAndStoreSelectedProject(edited);
      }
      delete this.clickedEditProject[this.project.id];
      sub.unsubscribe();
    });
  }

  deleteProject(): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Project',
        message: `You are on the way to delete the project ${
            this.project
                .name}. Deletion of projects cannot be undone! If you know what you are doing, please type the name of the project:`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
        compareName: this.project.name,
        inputPlaceholder: 'Name of the Project:',
        inputTitle: 'Project name',
      },
    };

    this.clickedDeleteProject[this.project.id] = true;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('projectOverview', 'deleteProjectOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteProject(this.project.id).subscribe(() => {
          NotificationActions.success('Success', `Project is being deleted`);
          this.googleAnalyticsService.emitEvent('projectOverview', 'ProjectDeleted');

          this.projectService.changeSelectedProject({
            id: '',
            name: '',
            creationTimestamp: null,
            deletionTimestamp: null,
            status: '',
          });

          this.projectService.removeProject();
          delete this.clickedDeleteProject[this.project.id];
          setTimeout(() => {
            this.projectService.navigateToProjectPage();
          });
        });
      }
    });
  }
}
