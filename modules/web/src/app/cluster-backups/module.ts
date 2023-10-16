// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {ClusterBackupsRoutingModule} from './routing';
import {ClusterBackupsComponent} from './list/component';
import {ClustersBackupsListComponent} from './list/backups/component';
import {SharedModule} from '@app/shared/module';
import {ClustersRestoresListComponent} from './list/restore/component';
import {AddClustersBackupsDialogComponent} from './list/backups/add-dialog/component';
import {DeleteBackupDialogComponent} from './list/backups/delete-dialog/component';
import {AddRestoreDialogComponent} from './list/restore/add-dialog/component';
import {DeleteRestoreDialogComponent} from './list/restore/delete-dialog/component';

@NgModule({
  imports: [SharedModule, ClusterBackupsRoutingModule],
  declarations: [
    ClusterBackupsComponent,
    ClustersBackupsListComponent,
    ClustersRestoresListComponent,
    AddClustersBackupsDialogComponent,
    DeleteBackupDialogComponent,
    AddRestoreDialogComponent,
    DeleteRestoreDialogComponent,
  ],
  exports: [
    ClusterBackupsComponent,
    ClustersBackupsListComponent,
    ClustersRestoresListComponent,
    AddClustersBackupsDialogComponent,
    DeleteBackupDialogComponent,
    AddRestoreDialogComponent,
    DeleteRestoreDialogComponent,
  ],
})
export class ClusterBackupsModule {}
