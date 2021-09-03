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
import {DatacenterService} from '@core/services/datacenter';
import {AdminSeed} from '@shared/entity/datacenter';

export interface BucketSettingsDialogConfig {
  seed: AdminSeed;
}

enum Controls {
  Bucket = 's3BucketName',
  Endpoint = 's3Endpoint',
}

@Component({
  selector: 'km-edit-bucket-setting-dialog',
  templateUrl: './template.html',
})
export class EditBucketSettingDialog implements OnInit {
  form: FormGroup;

  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialogRef: MatDialogRef<EditBucketSettingDialog>,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: BucketSettingsDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Bucket]: new FormControl(this.data.seed.spec.backupRestore.s3BucketName, [Validators.required]),
      [Controls.Endpoint]: new FormControl(this.data.seed.spec.backupRestore.s3Endpoint),
    });
  }

  edit(): void {
    const configuration: AdminSeed = {
      name: this.data.seed.name,
      spec: {
        backupRestore: {
          [Controls.Bucket]: this.form.get(Controls.Bucket).value,
          [Controls.Endpoint]: this.form.get(Controls.Endpoint).value,
        },
      },
    };

    this._datacenterService.patchAdminSeed(configuration.name, configuration).subscribe(_ => {
      this._matDialogRef.close();
      this._notificationService.success('Bucket settings were successfully updated');
      this._datacenterService.refreshAdminSeeds();
    });
  }
}
