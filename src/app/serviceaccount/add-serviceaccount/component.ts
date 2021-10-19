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
import {Project} from '@shared/entity/project';
import {ServiceAccountModel} from '@shared/entity/service-account';
import {take} from 'rxjs/operators';

@Component({
  selector: 'km-add-serviceaccount',
  templateUrl: './template.html',
})
export class AddServiceAccountComponent implements OnInit {
  @Input() project: Project;
  addServiceAccountForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialogRef: MatDialogRef<AddServiceAccountComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.addServiceAccountForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      group: new FormControl('editors', [Validators.required]),
    });
  }

  addServiceAccount(): void {
    if (!this.addServiceAccountForm.valid) {
      return;
    }

    const createServiceAccount: ServiceAccountModel = {
      name: this.addServiceAccountForm.controls.name.value,
      group: this.addServiceAccountForm.controls.group.value,
    };

    this._apiService
      .createServiceAccount(this.project.id, createServiceAccount)
      .pipe(take(1))
      .subscribe(() => {
        this._matDialogRef.close(true);
        this._notificationService.success(
          `The ${createServiceAccount.name} service account was added to the ${this.project.name} project`
        );
      });
  }
}
