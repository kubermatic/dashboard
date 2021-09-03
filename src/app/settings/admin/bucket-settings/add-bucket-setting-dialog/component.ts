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

import {Component, OnInit, Inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {BackupService} from '@core/services/backup';
import {DatacenterService} from '@core/services/datacenter';
import {BackupCredentials} from '@shared/entity/backup';
import {AdminSeed} from '@shared/entity/datacenter';

export interface BucketSettingsDialogConfig {
  seeds: AdminSeed[];
}

enum Controls {
  Seed = 'seed',
  Bucket = 's3BucketName',
  Endpoint = 's3Endpoint',
  SecretAccessKey = 'secretAccessKey',
  AccessKey = 'accessKeyId',
}

@Component({
  selector: 'km-add-bucket-setting-dialog',
  templateUrl: './template.html',
})
export class AddBucketSettingDialog implements OnInit {
  form: FormGroup;

  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _backupService: BackupService,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialogRef: MatDialogRef<AddBucketSettingDialog>,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: BucketSettingsDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Seed]: new FormControl('', [Validators.required]),
      [Controls.Bucket]: new FormControl('', [Validators.required]),
      [Controls.Endpoint]: new FormControl(''),
      [Controls.SecretAccessKey]: new FormControl('', [Validators.required]),
      [Controls.AccessKey]: new FormControl('', [Validators.required]),
    });
  }

  add(): void {
    const configuration: AdminSeed = {
      name: this.form.get(Controls.Seed).value,
      spec: {
        backupRestore: {
          [Controls.Bucket]: this.form.get(Controls.Bucket).value,
          [Controls.Endpoint]: this.form.get(Controls.Endpoint).value,
        },
      },
    };

    const credentials: BackupCredentials = {
      s3: {
        [Controls.SecretAccessKey]: this.form.get(Controls.SecretAccessKey).value,
        [Controls.AccessKey]: this.form.get(Controls.AccessKey).value,
      },
    };

    this._datacenterService.patchAdminSeed(this.form.get(Controls.Seed).value, configuration).subscribe(_ => {
      this._notificationService.success('Credentials were successfully added to bucket');
      this._matDialogRef.close();
      this._datacenterService.refreshAdminSeeds();
    });

    this._backupService.updateBackupCredentials(this.form.get(Controls.Seed).value, credentials).subscribe(_ => {
      this._notificationService.success('Credentials were successfully added to bucket');
      this._matDialogRef.close();
    });
  }
}
