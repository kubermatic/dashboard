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

import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {EtcdBackupConfig} from '@shared/entity/backup';

export interface RestoreSnapshotDialogConfig {
  snapshot: EtcdBackupConfig;
}

@Component({
  selector: 'km-restore-snapshot-dialog',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class RestoreSnapshotDialogComponent {
  get snapshot(): EtcdBackupConfig {
    return this._config.snapshot;
  }

  constructor(
    private readonly _dialogRef: MatDialogRef<RestoreSnapshotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly _config: RestoreSnapshotDialogConfig
  ) {}

  restore(): void {
    // this._backupService
    //   .create(this._config.projectID, this._toEtcdBackupConfig())
    //   .pipe(take(1))
    //   .subscribe(_ => this._dialogRef.close(true));

    this._dialogRef.close(true);
  }
}
