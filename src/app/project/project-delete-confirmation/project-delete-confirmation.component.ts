import {Component, DoCheck, ElementRef, Input, ViewChild} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-project-delete-confirmation',
  templateUrl: './project-delete-confirmation.component.html',
})

export class ProjectDeleteConfirmationComponent implements DoCheck {
  @Input() project: ProjectEntity;
  @ViewChild('projectNameInput') projectNameInputRef: ElementRef;

  inputName = '';

  constructor(private api: ApiService, private dialogRef: MatDialogRef<ProjectDeleteConfirmationComponent>) {}

  ngDoCheck(): void {
    this.projectNameInputRef.nativeElement.focus();
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
      this.api.deleteProject(this.project.id).subscribe(() => {
        NotificationActions.success('Success', `Project is being deleted`);
      });
      this.dialogRef.close(true);
    }
  }
}
