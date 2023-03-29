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

import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {MatStepper} from '@angular/material/stepper';
import {SafeUrl} from '@angular/platform-browser';
import {ServiceAccountTokenDialogService} from '@app/serviceaccount/token/add/steps/service';
import {NotificationService} from '@core/services/notification';
import {
  CreateTokenEntity,
  ServiceAccount,
  ServiceAccountToken,
  ServiceAccountTokenPatch,
} from '@shared/entity/service-account';
import {getIconClassForButton} from '@shared/utils/common';
import {take} from 'rxjs/operators';
import {ServiceAccountService} from '@core/services/service-account';
import {Observable} from 'rxjs';

enum StepRegistry {
  Name = 'Create Token',
  Information = 'Token Information',
}

enum Controls {
  Name = 'name',
  Information = 'information',
}

export enum ServiceAccountTokenDialogMode {
  Create = 'Add',
  Edit = 'Edit',
  Regenerate = 'Regenerate',
}

export interface ServiceAccountTokenDialogData {
  projectID: string;
  serviceAccount: ServiceAccount;
  mode: ServiceAccountTokenDialogMode;
  token?: ServiceAccountToken;
}

@Component({
  selector: 'km-serviceaccount-token-dialog',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ServiceAccountTokenDialog implements OnInit {
  form: FormGroup;
  updating = false;
  created = false;

  readonly registry = StepRegistry;
  readonly controls = Controls;
  readonly modes = ServiceAccountTokenDialogMode;

  private _stepper: MatStepper;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _data: ServiceAccountTokenDialogData,
    private readonly _serviceAccountService: ServiceAccountService,
    private readonly _dialogRef: MatDialogRef<ServiceAccountTokenDialog>,
    private readonly _notificationService: NotificationService,
    private readonly _tokenDialogService: ServiceAccountTokenDialogService,
    private readonly _builder: FormBuilder
  ) {}

  @ViewChild('stepper')
  set matStepper(stepper: MatStepper) {
    if (stepper) {
      this._stepper = stepper;
    }
  }

  get stepperFirstIndex(): boolean {
    return this._stepper ? this._stepper.selectedIndex === 0 : true;
  }

  get downloadURL(): SafeUrl {
    return this._tokenDialogService.downloadUrl;
  }

  get downloadTitle(): string {
    return this._tokenDialogService.downloadTitle;
  }

  get mode(): ServiceAccountTokenDialogMode {
    return this._data.mode || ServiceAccountTokenDialogMode.Create;
  }

  ngOnInit(): void {
    this._tokenDialogService.projectID = this._data.projectID;
    this.form = new FormGroup({
      [Controls.Name]: this._builder.control(''),
      [Controls.Information]: this._builder.control(''),
    });

    if (this.mode === ServiceAccountTokenDialogMode.Regenerate) {
      this._regenerate();
    }
  }

  getIconClass(): string {
    return getIconClassForButton(this._data.mode);
  }

  getObservable(): Observable<ServiceAccountToken> | void {
    switch (this._data.mode) {
      case ServiceAccountTokenDialogMode.Create:
        return this._create();
      case ServiceAccountTokenDialogMode.Edit:
        return this._edit();
    }
  }

  onNext(token: ServiceAccountToken): void {
    this.updating = true;

    switch (this._data.mode) {
      case ServiceAccountTokenDialogMode.Create:
        this._notificationService.success(
          `Added the ${token.name} token to the ${this._data.serviceAccount.name} service account`
        );
        this._tokenDialogService.token = token.token;
        this.created = true;
        this._stepper.next();
        this.updating = false;
        break;
      case ServiceAccountTokenDialogMode.Edit:
        this._notificationService.success(`Updated the ${this._data.token.name} token`);
        this._dialogRef.close();
        this.updating = false;
    }
  }

  private _create(): Observable<ServiceAccountToken> {
    const entity: CreateTokenEntity = {
      name: this._tokenDialogService.tokenName,
    };

    return this._serviceAccountService
      .createToken(this._data.projectID, this._data.serviceAccount, entity)
      .pipe(take(1));
  }

  private _edit(): Observable<ServiceAccountToken> {
    const patch: ServiceAccountTokenPatch = {
      name: this._tokenDialogService.tokenName,
    };

    return this._serviceAccountService
      .patchToken(this._data.projectID, this._data.serviceAccount, this._data.token, patch)
      .pipe(take(1));
  }

  private _regenerate(): void {
    this.updating = true;
    this._tokenDialogService.tokenName = this._data.token.name;

    this._serviceAccountService
      .regenerateToken(this._data.projectID, this._data.serviceAccount, this._data.token)
      .pipe(take(1))
      .subscribe(
        token => {
          this._notificationService.success(`Regenerated the ${this._data.token.name} token`);
          this._tokenDialogService.token = token.token;
        },
        _ => {},
        (): void => {
          this.updating = false;
        }
      );
  }
}
