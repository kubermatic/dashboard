// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ApiService} from '@core/services/api';
import {NotificationService} from '@core/services/notification';
import {ResourceType} from '@shared/entity/common';
import {EditProject, Project} from '@shared/entity/project';
import {AsyncValidators} from '@shared/validators/async-label-form.validator';
import * as _ from 'lodash';

@Component({
  selector: 'km-edit-project',
  templateUrl: './template.html',
})
export class EditProjectComponent implements OnInit {
  @Input() project: Project;
  labels: object;
  form: FormGroup;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Project)];

  constructor(
    private api: ApiService,
    private dialogRef: MatDialogRef<EditProjectComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.project.labels);

    this.form = new FormGroup({
      name: new FormControl(this.project.name, [Validators.required]),
      labels: new FormControl(''),
    });
  }

  editProject(): void {
    if (!this.form.valid) {
      return;
    }

    const project: EditProject = {
      name: this.form.controls.name.value,
      labels: this.labels,
    };

    // Remove nullified labels as project uses PUT endpoint, not PATCH, and labels component returns patch object.
    // TODO: Make the labels component customizable so it can return patch (current implementation)
    //  or entity (without nullified labels).
    // TODO: Implement and use PATCH endpoint for project edits.
    for (const label in project.labels) {
      if (Object.prototype.hasOwnProperty.call(project.labels, label) && project.labels[label] === null) {
        delete project.labels[label];
      }
    }

    this.api.editProject(this.project.id, project).subscribe(project => {
      this.dialogRef.close(project);
      this._notificationService.success(`The ${this.project.name} project was updated`);
    });
  }
}
