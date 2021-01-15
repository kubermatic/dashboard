// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {ResourceType} from '@shared/entity/common';
import {CreateProjectModel} from '@shared/model/CreateProjectModel';
import {AsyncValidators} from '@shared/validators/async-label-form.validator';
import {GuidedTourID} from '@shared/components/guided-tour/utils';

@Component({
  selector: 'km-add-project-dialog',
  templateUrl: './add-project-dialog.component.html',
})
export class AddProjectDialogComponent implements OnInit {
  readonly GuidedTourID = GuidedTourID;

  form: FormGroup;
  labels: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Project)];

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialogRef: MatDialogRef<AddProjectDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      labels: new FormControl(''),
    });
  }

  addProject(): void {
    if (!this.form.valid) {
      return;
    }

    const createProject: CreateProjectModel = {
      name: this.form.controls.name.value,
      labels: this.labels,
    };
    this._apiService.createProject(createProject).subscribe(res => {
      this._matDialogRef.close(res);
      this._notificationService.success(`The ${createProject.name} project was added`);
    });
  }
}
