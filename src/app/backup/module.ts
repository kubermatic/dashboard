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

import {NgModule} from '@angular/core';
import {AddAutomaticBackupDialogComponent} from '@app/backup/backup-list/automatic-backup/add-dialog/component';
import {AutomaticBackupListComponent} from '@app/backup/backup-list/automatic-backup/component';
import {BackupListComponent} from '@app/backup/backup-list/component';
import {AddSnapshotDialogComponent} from '@app/backup/backup-list/snapshot/add-dialog/component';
import {SnapshotListComponent} from '@app/backup/backup-list/snapshot/component';
import {DeleteSnapshotDialogComponent} from '@app/backup/backup-list/snapshot/delete-dialog/component';
import {RestoreSnapshotDialogComponent} from '@app/backup/backup-list/snapshot/restore-dialog/component';
import {SharedModule} from '@shared/module';
import {BackupRoutingModule} from './routing';

const components: any[] = [
  BackupListComponent,
  AutomaticBackupListComponent,
  AddAutomaticBackupDialogComponent,
  SnapshotListComponent,
  AddSnapshotDialogComponent,
  DeleteSnapshotDialogComponent,
  RestoreSnapshotDialogComponent,
];

@NgModule({
  imports: [SharedModule, BackupRoutingModule],
  declarations: [...components],
  exports: [...components],
})
export class BackupModule {}
