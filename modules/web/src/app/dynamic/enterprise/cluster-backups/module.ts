//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2023 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

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
import {ClustersScheduleBackupsListComponent} from './list/schedule/component';
import {BackupStorageLocationsListComponent} from './list/backup-storage-location/component';
import {AddBackupStorageLocationDialogComponent} from './list/backup-storage-location/add-dialog/component';

@NgModule({
  imports: [SharedModule, ClusterBackupsRoutingModule],
  declarations: [
    ClusterBackupsComponent,
    ClustersBackupsListComponent,
    ClustersScheduleBackupsListComponent,
    ClustersRestoresListComponent,
    BackupStorageLocationsListComponent,
    AddClustersBackupsDialogComponent,
    DeleteBackupDialogComponent,
    AddRestoreDialogComponent,
    DeleteRestoreDialogComponent,
    AddBackupStorageLocationDialogComponent,
  ],
})
export class ClusterBackupsModule {}
