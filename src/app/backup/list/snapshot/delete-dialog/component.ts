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
import {EtcdBackupConfig} from '@shared/entity/backup';
import {take} from 'rxjs/operators';

export interface DeleteSnapshotDialogConfig {
  snapshot: EtcdBackupConfig;
  projectID: string;
}

@Component({
  selector: 'km-delete-snapshot-dialog',
  templateUrl: './template.html',
})
export class DeleteSnapshotDialogComponent {
  constructor(
    private readonly _dialogRef: MatDialogRef<DeleteSnapshotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public config: DeleteSnapshotDialogConfig,
    private readonly _backupService: BackupService,
    private readonly _notificationService: NotificationService
  ) {}

  delete(): void {
    this._backupService
      .delete(this.config.projectID, this.config.snapshot.spec.clusterId, this.config.snapshot.id)
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Successfully deleted snapshot ${this.config.snapshot.name}`);
        this._dialogRef.close(true);
      });
  }
}
