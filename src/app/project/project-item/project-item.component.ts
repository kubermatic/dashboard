import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ApiService } from '../../core/services';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { ProjectDeleteConfirmationComponent } from './../project-delete-confirmation/project-delete-confirmation.component';

@Component({
  selector: 'kubermatic-project-item',
  templateUrl: './project-item.component.html',
  styleUrls: ['./project-item.component.scss'],
})
export class ProjectItemComponent implements OnInit, OnDestroy {
  @Input() index: number;
  @Input() project: ProjectEntity;

  constructor(private apiService: ApiService,
              public dialog: MatDialog,
              private router: Router) {}

  public ngOnInit(): void { }

  public getProjectItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'odd';
    }
  }

  public deleteProject(): void {
    const modal = this.dialog.open(ProjectDeleteConfirmationComponent);
    modal.componentInstance.project = this.project;
    const sub = modal.afterClosed().subscribe(deleted => {
      if (deleted) {
        this.router.navigate(['/projects']);
      }
      sub.unsubscribe();
    });
  }

  public ngOnDestroy(): void { }
}
