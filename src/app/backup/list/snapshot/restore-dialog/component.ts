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
import {BackupService} from '@core/services/backup';
import {NotificationService} from '@core/services/notification';
import {EtcdRestore, EtcdRestoreSpec} from '@shared/entity/backup';
import {take} from 'rxjs/operators';

export interface RestoreSnapshotDialogConfig {
  backupName: string;
  clusterID: string;
  projectID: string;
}

@Component({
  selector: 'km-restore-snapshot-dialog',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class RestoreSnapshotDialogComponent {
  constructor(
    private readonly _dialogRef: MatDialogRef<RestoreSnapshotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly config: RestoreSnapshotDialogConfig,
    private readonly _backupService: BackupService,
    private readonly _notificationService: NotificationService
  ) {}

  restore(): void {
    this._backupService
      .restore(this.config.projectID, this.config.clusterID, this._toEtcdRestore())
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Successfully started restore process from backup ${this.config.backupName}`);
        this._dialogRef.close(true);
      });
  }

  private _toEtcdRestore(): EtcdRestore {
    return {
      spec: {
        backupName: this.config.backupName,
        clusterId: this.config.clusterID,
      } as EtcdRestoreSpec,
    } as EtcdRestore;
  }
}
