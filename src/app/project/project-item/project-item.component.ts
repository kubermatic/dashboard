import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {AppConfigService} from '../../app-config.service';
import {ProjectService, UserService} from '../../core/services';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {UserGroupConfig} from '../../shared/model/Config';
import {ProjectDeleteConfirmationComponent} from '../project-delete-confirmation/project-delete-confirmation.component';

@Component({
  selector: 'kubermatic-project-item',
  templateUrl: './project-item.component.html',
  styleUrls: ['./project-item.component.scss'],
})
export class ProjectItemComponent implements OnInit {
  @Input() index: number;
  @Input() project: ProjectEntity;
  clickedDeleteProject = {};
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  constructor(
      public dialog: MatDialog, public projectService: ProjectService, private userService: UserService,
      private appConfigService: AppConfigService) {}

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
    if (!this.clickedDeleteProject[this.project.id]) {
      this.projectService.changeAndStoreSelectedProject(this.project);
    }
  }

  deleteProject(): void {
    this.clickedDeleteProject[this.project.id] = true;
    const modal = this.dialog.open(ProjectDeleteConfirmationComponent);
    modal.componentInstance.project = this.project;
    const sub = modal.afterClosed().subscribe((deleted) => {
      if (deleted) {
        this.projectService.navigateToProjectPage();
        this.projectService.changeSelectedProject({
          id: '',
          name: '',
          creationTimestamp: null,
          deletionTimestamp: null,
          status: '',
        });
      }
      this.projectService.removeProject();
      delete this.clickedDeleteProject[this.project.id];
      sub.unsubscribe();
    });
  }
}
