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

import {NgModule} from '@angular/core';
import {BackupListComponent} from '@app/backup/details/automatic-backup/backups/component';
import {AutomaticBackupDetailsComponent} from '@app/backup/details/automatic-backup/component';
import {SnapshotDetailsComponent} from '@app/backup/details/snapshot/component';
import {AddAutomaticBackupDialogComponent} from '@app/backup/list/automatic-backup/add-dialog/component';
import {AutomaticBackupListComponent} from '@app/backup/list/automatic-backup/component';
import {BackupsComponent} from '@app/backup/list/component';
import {RestoreListComponent} from '@app/backup/list/restore/component';
import {AddSnapshotDialogComponent} from '@app/backup/list/snapshot/add-dialog/component';
import {SnapshotListComponent} from '@app/backup/list/snapshot/component';
import {DeleteSnapshotDialogComponent} from '@app/backup/list/snapshot/delete-dialog/component';
import {RestoreSnapshotDialogComponent} from '@app/backup/list/snapshot/restore-dialog/component';
import {SharedModule} from '@shared/module';
import {BackupRoutingModule} from './routing';

@NgModule({
  imports: [SharedModule, BackupRoutingModule],
  declarations: [
    BackupListComponent,
    BackupsComponent,
    AutomaticBackupListComponent,
    AutomaticBackupDetailsComponent,
    AddAutomaticBackupDialogComponent,
    SnapshotListComponent,
    AddSnapshotDialogComponent,
    DeleteSnapshotDialogComponent,
    RestoreSnapshotDialogComponent,
    SnapshotDetailsComponent,
    RestoreListComponent,
  ],
  exports: [
    BackupListComponent,
    BackupsComponent,
    AutomaticBackupListComponent,
    AutomaticBackupDetailsComponent,
    AddAutomaticBackupDialogComponent,
    SnapshotListComponent,
    AddSnapshotDialogComponent,
    DeleteSnapshotDialogComponent,
    RestoreSnapshotDialogComponent,
    SnapshotDetailsComponent,
    RestoreListComponent,
  ],
})
export class BackupModule {}
