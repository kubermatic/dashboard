import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import * as _ from 'lodash';

import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {EditProjectEntity, ProjectEntity} from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-edit-project',
  templateUrl: './edit-project.component.html',
})
export class EditProjectComponent implements OnInit {
  @Input() project: ProjectEntity;
  labels: object;
  form: FormGroup;

  constructor(private api: ApiService, private dialogRef: MatDialogRef<EditProjectComponent>) {}

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.project.labels);

    this.form = new FormGroup({
      name: new FormControl(this.project.name, [Validators.required]),
    });
  }

  editProject(): void {
    const editProjectEntity: EditProjectEntity = {
      name: this.form.controls.name.value,
      labels: this.labels,
    };

    this.api.editProject(this.project.id, editProjectEntity).subscribe((project) => {
      this.dialogRef.close(project);
      NotificationActions.success(`Project ${this.project.name} has been edited successfully`);
    });
  }
}
