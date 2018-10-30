import { Component, DoCheck, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ApiService } from './../../core/services';
import { NotificationActions } from './../../redux/actions/notification.actions';
import { ProjectEntity } from './../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-project-delete-confirmation',
  templateUrl: './project-delete-confirmation.component.html',
  styleUrls: ['./project-delete-confirmation.component.scss']
})

export class ProjectDeleteConfirmationComponent implements DoCheck {
  @Input() project: ProjectEntity;

  public inputName = '';

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<ProjectDeleteConfirmationComponent>) {
  }

  ngDoCheck(): void {
    document.getElementById('name').focus();
  }

  onChange(event: any): void {
    this.inputName = event.target.value;
  }

  inputNameMatches(): boolean {
    return this.inputName === this.project.name;
  }

  deleteProject(): void {
    if (!this.inputNameMatches()) {
      return;
    } else {
      this.api.deleteProject(this.project.id).subscribe(result => {
        NotificationActions.success('Success', `Project is being deleted`);
      });
      this.dialogRef.close(true);
    }
  }
}
