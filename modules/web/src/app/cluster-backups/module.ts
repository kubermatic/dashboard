import { NgModule } from '@angular/core';

import { ClusterBackupsRoutingModule } from './routing';
import { ClusterBackupsComponent } from './list/component';
import { ClustersBackupsListComponent } from './list/backups/component';
import { SharedModule } from '@app/shared/module';
import { ClustersRestoresListComponent } from './list/restore/component';


@NgModule({
  imports: [
    SharedModule,
    ClusterBackupsRoutingModule
  ],
  declarations: [
    ClusterBackupsComponent,
    ClustersBackupsListComponent,
    ClustersRestoresListComponent,
  ],
  exports: [
    ClusterBackupsComponent,
    ClustersBackupsListComponent,
    ClustersRestoresListComponent,
  ],
})
export class ClusterBackupsModule { }
