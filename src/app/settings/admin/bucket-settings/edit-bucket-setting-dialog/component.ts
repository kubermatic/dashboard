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
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {DatacenterService} from '@core/services/datacenter';
import {AdminSeed} from '@shared/entity/datacenter';
import * as _ from 'lodash';

export interface EditBucketSettingsDialogConfig {
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
  readonly Controls = Controls;
  form: FormGroup;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialogRef: MatDialogRef<EditBucketSettingDialog>,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: EditBucketSettingsDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Bucket]: this._builder.control(this._setBucketName(), [Validators.required]),
      [Controls.Endpoint]: this._builder.control(this._setEndpoint()),
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
      this._notificationService.success('Bucket settings were successfully edited');
      this._datacenterService.refreshAdminSeeds();
    });
  }

  private _setBucketName(): string {
    if (!_.isEmpty(this.data.seed.spec.backupRestore) && !_.isEmpty(this.data.seed.spec.backupRestore.s3BucketName)) {
      return this.data.seed.spec.backupRestore.s3BucketName;
    }
    return '';
  }

  private _setEndpoint(): string {
    if (!_.isEmpty(this.data.seed.spec.backupRestore) && !_.isEmpty(this.data.seed.spec.backupRestore.s3Endpoint)) {
      return this.data.seed.spec.backupRestore.s3Endpoint;
    }
    return '';
  }
}
