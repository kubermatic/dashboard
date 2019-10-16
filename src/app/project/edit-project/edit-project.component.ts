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
    const project: EditProjectEntity = {
      name: this.form.controls.name.value,
      labels: this.labels,
    };

    // Remove nullified labels as project uses PUT endpoint, not PATCH, and labels component returns patch object.
    // TODO: Make the labels component customizable so it can return patch (current implementation)
    //  or entity (without nullified labels).
    // TODO: Implement and use PATCH endpoint for project edits.
    for (const label in project.labels) {
      if (project.labels.hasOwnProperty(label) && project.labels[label] === null) {
        delete project.labels[label];
      }
    }

    this.api.editProject(this.project.id, project).subscribe((project) => {
      this.dialogRef.close(project);
      NotificationActions.success(`Project ${this.project.name} has been edited successfully`);
    });
  }
}
