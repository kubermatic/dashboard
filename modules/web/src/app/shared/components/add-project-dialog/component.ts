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
import {Project, ProjectModel} from '@shared/entity/project';
import {take} from 'rxjs/operators';
import {AsyncValidators} from '../../validators/async.validators';
import {OperatingSystem} from '@app/shared/model/NodeProviderConstants';
import _ from 'lodash';
import {AllowedOperatingSystems, DEFAULT_ADMIN_SETTINGS} from '@app/shared/entity/settings';

enum Controls {
  Name = 'name',
  Labels = 'labels',
  AllowedOperatingSystems = 'allowedOperatingSystems',
}

@Component({
  selector: 'km-add-project-dialog',
  templateUrl: './template.html',
})
export class AddProjectDialogComponent implements OnInit {
  readonly Controls = Controls;
  form: FormGroup;
  labels: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Project)];
  adding = false;
  allowedOperatingSystems: AllowedOperatingSystems = DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems;
  OperatingSystem = OperatingSystem;

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _matDialogRef: MatDialogRef<AddProjectDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      [Controls.Name]: new FormControl('', [Validators.required]),
      [Controls.Labels]: new FormControl(''),
      [Controls.AllowedOperatingSystems]: new FormControl(Object.keys(this.allowedOperatingSystems)),
    });
  }

  onOperatingSystemChange(operatingSystems: string[]): void {
    this.allowedOperatingSystems = {};
    operatingSystems.forEach((os: string) => (this.allowedOperatingSystems[os] = true));
  }

  getObservable(): Observable<Project> {
    const project: ProjectModel = {
      name: this.form.controls.name.value,
      labels: this.labels,
      spec: {
        allowedOperatingSystems: this.allowedOperatingSystems,
      },
    };
    return this._projectService.create(project).pipe(take(1));
  }

  onNext(project: Project): void {
    this._matDialogRef.close(project);
    this._notificationService.success(`Added the ${project.name} project`);
  }
}
