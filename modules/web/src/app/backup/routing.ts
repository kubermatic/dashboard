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
import {RouterModule, Routes} from '@angular/router';
import {AutomaticBackupDetailsComponent} from '@app/backup/details/automatic-backup/component';
import {SnapshotDetailsComponent} from '@app/backup/details/snapshot/component';
import {BackupsComponent} from '@app/backup/list/component';
import {AuthGuard, AuthzGuard} from '@core/services/auth/guard';

const routes: Routes = [
  {
    path: '',
    component: BackupsComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
  {
    path: ':backupID',
    component: AutomaticBackupDetailsComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
  {
    path: 'snapshots/:backupID',
    component: SnapshotDetailsComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BackupRoutingModule {}
