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
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';

import {Project} from '@shared/entity/project';
import {CreateTokenEntity, ServiceAccount, ServiceAccountToken} from '@shared/entity/service-account';
import {TokenDialogComponent} from '../token-dialog/token-dialog.component';
import {take} from 'rxjs/operators';

@Component({
  selector: 'km-add-serviceaccount-token',
  templateUrl: './add-serviceaccount-token.component.html',
})
export class AddServiceAccountTokenComponent implements OnInit {
  @Input() project: Project;
  @Input() serviceaccount: ServiceAccount;
  addServiceAccountTokenForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialog: MatDialog,
    private readonly _matDialogRef: MatDialogRef<AddServiceAccountTokenComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.addServiceAccountTokenForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });
  }

  addServiceAccountToken(): void {
    const createServiceAccountToken: CreateTokenEntity = {
      name: this.addServiceAccountTokenForm.controls.name.value,
    };

    this._apiService
      .createServiceAccountToken(this.project.id, this.serviceaccount, createServiceAccountToken)
      .pipe(take(1))
      .subscribe(token => {
        this._matDialogRef.close(true);
        this._notificationService.success(
          `The ${createServiceAccountToken.name} token was added to the ${this.serviceaccount.name} service account`
        );
        this.openTokenDialog(token);
      });
  }

  openTokenDialog(token: ServiceAccountToken): void {
    const modal = this._matDialog.open(TokenDialogComponent);
    modal.componentInstance.serviceaccountToken = token;
    modal.componentInstance.projectID = this.project.id;
  }
}
