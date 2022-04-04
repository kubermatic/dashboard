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
import {NotificationService} from '@core/services/notification';
import {Project} from '@shared/entity/project';
import {ServiceAccount} from '@shared/entity/service-account';
import {take} from 'rxjs/operators';
import {ServiceAccountService} from '@core/services/service-account';
import {Observable} from 'rxjs';

@Component({
  selector: 'km-create-service-account-dialog',
  templateUrl: './template.html',
})
export class CreateServiceAccountDialogComponent implements OnInit {
  @Input() project: Project;
  form: FormGroup;

  constructor(
    private readonly _serviceAccountService: ServiceAccountService,
    private readonly _matDialogRef: MatDialogRef<CreateServiceAccountDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      group: new FormControl('editors', [Validators.required]),
    });
  }

  getObservable(): Observable<ServiceAccount> {
    return this._serviceAccountService
      .create(this.project.id, {
        name: this.form.controls.name.value,
        group: this.form.controls.group.value,
      })
      .pipe(take(1));
  }

  onNext(sa: ServiceAccount): void {
    this._matDialogRef.close(true);
    this._notificationService.success(`Created the ${sa.name} service account in the ${this.project.name} project`);
  }
}
