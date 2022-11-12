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

import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {ResourceType} from '@shared/entity/common';
import {ProjectService} from '@core/services/project';
import {Observable} from 'rxjs';
import {Project} from '@shared/entity/project';
import {take} from 'rxjs/operators';
import {AsyncValidators} from '../../validators/async.validators';

@Component({
  selector: 'km-add-project-dialog',
  templateUrl: './template.html',
})
export class AddProjectDialogComponent implements OnInit {
  form: FormGroup;
  labels: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Project)];
  adding = false;

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _matDialogRef: MatDialogRef<AddProjectDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      labels: new FormControl(''),
    });
  }

  getObservable(): Observable<Project> {
    return this._projectService.create({name: this.form.controls.name.value, labels: this.labels}).pipe(take(1));
  }

  onNext(project: Project): void {
    this._matDialogRef.close(project);
    this._notificationService.success(`Added the ${project.name} project`);
  }
}
