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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {NotificationService} from '@core/services/notification';
import {Project} from '@shared/entity/project';
import {ServiceAccount} from '@shared/entity/service-account';
import {take} from 'rxjs/operators';
import {ServiceAccountService} from '@core/services/service-account';
import {Observable} from 'rxjs';
import {DialogModeService} from '@app/core/services/dialog-mode';

@Component({
  selector: 'km-edit-dialog',
  templateUrl: './template.html',
})
export class EditServiceAccountDialogComponent implements OnInit, OnDestroy {
  @Input() project: Project;
  @Input() serviceaccount: ServiceAccount;
  form: FormGroup;

  constructor(
    private readonly _serviceAccountService: ServiceAccountService,
    private readonly _matDialogRef: MatDialogRef<EditServiceAccountDialogComponent>,
    private readonly _notificationService: NotificationService,
    private _isEditDialog: DialogModeService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(this.serviceaccount.name, [Validators.required]),
      group: new FormControl(this.serviceaccount.group.replace(/(-[\w\d]+$)/, ''), [Validators.required]),
    });
  }

  ngOnDestroy(): void {
    this._isEditDialog.isEditDialog = false;
  }

  getObservable(): Observable<ServiceAccount> {
    const editServiceAccount: ServiceAccount = {
      id: this.serviceaccount.id,
      name: this.form.controls.name.value,
      creationTimestamp: this.serviceaccount.creationTimestamp,
      deletionTimestamp: this.serviceaccount.deletionTimestamp,
      group: this.form.controls.group.value,
      status: this.serviceaccount.status,
    };

    return this._serviceAccountService.edit(this.project.id, editServiceAccount).pipe(take(1));
  }

  onNext(): void {
    this._matDialogRef.close(true);
    this._notificationService.success(`Updated the ${this.serviceaccount.name} service account`);
  }
}
