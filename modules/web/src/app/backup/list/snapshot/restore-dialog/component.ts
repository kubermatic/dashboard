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

import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BackupService} from '@core/services/backup';
import {NotificationService} from '@core/services/notification';
import {EtcdBackupConfig, EtcdRestore, EtcdRestoreSpec} from '@shared/entity/backup';
import {Observable} from 'rxjs';
import {take} from 'rxjs/operators';

export interface RestoreSnapshotDialogConfig {
  backupName: string;
  clusterID: string;
  projectID: string;
  destination: string;
}

@Component({
    selector: 'km-restore-snapshot-dialog',
    templateUrl: './template.html',
    styleUrls: ['style.scss'],
    standalone: false
})
export class RestoreSnapshotDialogComponent {
  constructor(
    private readonly _dialogRef: MatDialogRef<RestoreSnapshotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly config: RestoreSnapshotDialogConfig,
    private readonly _backupService: BackupService,
    private readonly _notificationService: NotificationService
  ) {}

  getObservable(): Observable<EtcdBackupConfig> {
    return this._backupService
      .restore(this.config.projectID, this.config.clusterID, this._toEtcdRestore())
      .pipe(take(1));
  }

  onNext(): void {
    this._notificationService.success(`Started restore process from the ${this.config.backupName} backup`);
    this._dialogRef.close(true);
  }

  private _toEtcdRestore(): EtcdRestore {
    return {
      spec: {
        backupName: this.config.backupName,
        clusterId: this.config.clusterID,
        destination: this.config.destination,
      } as EtcdRestoreSpec,
    } as EtcdRestore;
  }
}
