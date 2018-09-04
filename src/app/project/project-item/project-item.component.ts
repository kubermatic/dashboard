import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ProjectService } from '../../core/services';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { ProjectDeleteConfirmationComponent } from './../project-delete-confirmation/project-delete-confirmation.component';

@Component({
  selector: 'kubermatic-project-item',
  templateUrl: './project-item.component.html',
  styleUrls: ['./project-item.component.scss'],
})
export class ProjectItemComponent implements OnInit {
  @Input() index: number;
  @Input() project: ProjectEntity;
  public clickedDeleteProject = {};

  constructor(public dialog: MatDialog,
              private router: Router,
              private projectService: ProjectService) {}

  public ngOnInit(): void { }

  public getProjectItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'odd';
    }
  }

  public selectProject() {
    if (!this.clickedDeleteProject[this.project.id]) {
      this.projectService.changeSelectedProject(this.project);
      this.router.navigate(['/clusters/' + this.project.id]);
    }
  }

  public deleteProject(): void {
    this.clickedDeleteProject[this.project.id] = true;
    const modal = this.dialog.open(ProjectDeleteConfirmationComponent);
    modal.componentInstance.project = this.project;
    const sub = modal.afterClosed().subscribe(deleted => {
      if (deleted) {
        this.router.navigate(['/projects']);
        this.projectService.changeSelectedProject({
          id: '',
          name: '',
          creationTimestamp: null,
          deletionTimestamp: null,
          status: ''
        });
      }
      delete this.clickedDeleteProject[this.project.id];
      sub.unsubscribe();
    });
  }
}
