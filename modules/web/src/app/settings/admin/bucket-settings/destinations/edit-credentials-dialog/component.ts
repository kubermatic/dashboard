// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {BackupService} from '@core/services/backup';
import {NotificationService} from '@core/services/notification';
import {BackupCredentials} from '@shared/entity/backup';
import {AdminSeed, BackupDestination} from '@shared/entity/datacenter';
import {Observable} from 'rxjs';

export interface EditCredentialsDialogConfig {
  seed: AdminSeed;
  destination: BackupDestination;
}

enum Controls {
  SecretAccessKey = 'secretAccessKey',
  AccessKey = 'accessKeyID',
}

@Component({
  selector: 'km-edit-credentials-dialog',
  templateUrl: './template.html',
})
export class EditCredentialsDialog implements OnInit {
  form: FormGroup;

  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _backupService: BackupService,
    private readonly _matDialogRef: MatDialogRef<EditCredentialsDialog>,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: EditCredentialsDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.SecretAccessKey]: this._builder.control('', [Validators.required]),
      [Controls.AccessKey]: this._builder.control('', [Validators.required]),
    });
  }

  getObservable(): Observable<void> {
    const credentials: BackupCredentials = {
      backup_credentials: {
        destination: this.data.destination.destinationName,
        s3: {
          [Controls.SecretAccessKey]: this.form.get(Controls.SecretAccessKey).value,
          [Controls.AccessKey]: this.form.get(Controls.AccessKey).value,
        },
      },
    };

    return this._backupService.updateBackupCredentials(this.data.seed.name, credentials);
  }

  onNext(): void {
    this._matDialogRef.close();
    this._notificationService.success('Updated backup credentials');
  }
}
