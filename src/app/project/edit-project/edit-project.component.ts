import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {EditProjectEntity, ProjectEntity} from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-edit-project',
  templateUrl: './edit-project.component.html',
})
export class EditProjectComponent implements OnInit {
  @Input() project: ProjectEntity;
  editProjectForm: FormGroup;

  constructor(private api: ApiService, private dialogRef: MatDialogRef<EditProjectComponent>) {}

  ngOnInit(): void {
    this.editProjectForm = new FormGroup({
      name: new FormControl(this.project.name, [Validators.required]),
    });
  }

  editProject(): void {
    const editProjectEntity: EditProjectEntity = {
      name: this.editProjectForm.controls.name.value,
    };

    this.api.editProject(this.project.id, editProjectEntity).subscribe((project) => {
      this.dialogRef.close(project);
      NotificationActions.success('Success', `Project ${this.project.name} has been edited successfully`);
    });
  }
}
