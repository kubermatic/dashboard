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

import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';

import {ApiService, NotificationService} from '../../../core/services';
import {Project} from '../../../shared/entity/project';
import {ServiceAccount, ServiceAccountToken, ServiceAccountTokenPatch} from '../../../shared/entity/service-account';

@Component({
  selector: 'km-edit-serviceaccount-token',
  templateUrl: './edit-serviceaccount-token.component.html',
})
export class EditServiceAccountTokenComponent implements OnInit {
  @Input() project: Project;
  @Input() serviceaccount: ServiceAccount;
  @Input() token: ServiceAccountToken;
  editServiceAccountTokenForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialogRef: MatDialogRef<EditServiceAccountTokenComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.editServiceAccountTokenForm = new FormGroup({
      name: new FormControl(this.token.name, [Validators.required]),
    });
  }

  editServiceAccountToken(): void {
    const patchServiceAccountToken: ServiceAccountTokenPatch = {
      name: this.editServiceAccountTokenForm.controls.name.value,
    };

    this._apiService
      .patchServiceAccountToken(this.project.id, this.serviceaccount, this.token, patchServiceAccountToken)
      .pipe(first())
      .subscribe(() => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The <strong>${this.token.name}</strong> token was updated`);
      });
  }
}
