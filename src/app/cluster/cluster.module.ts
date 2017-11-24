import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { UpgradeClusterComponent } from './upgrade-cluster/upgrade-cluster.component';
import { NgModule } from '@angular/core';
import { ClusterComponent } from 'app/cluster/cluster.component';
import { NodeDeleteConfirmationComponent } from 'app/cluster/node-delete-confirmation/node-delete-confirmation.component';
import { NodeDeleteConfirmationService } from 'app/cluster/node-delete-confirmation/node-delete-confirmation.service';
import { NodeComponent } from 'app/cluster/node/node.component';
import { ClusterDeleteConfirmationComponent } from 'app/cluster/cluster-delete-confirmation/cluster-delete-confirmation.component';
import { SharedModule } from 'app/shared/shared.module';
import { ClusterItemComponent } from './cluster-list/cluster-item/cluster-item.component';
import { ClusterHealthStatusComponent } from 'app/cluster-health-status/cluster-health-status.component';
import { RouterModule } from '@angular/router';

const components: any[] = [
    ClusterComponent,
    UpgradeClusterComponent,
    NodeDeleteConfirmationComponent,
    NodeComponent,
    ClusterDeleteConfirmationComponent,
    ClusterListComponent,
    ClusterItemComponent,
    ClusterHealthStatusComponent
];

@NgModule({
    imports: [
        SharedModule,
        RouterModule
    ],
    declarations: [
        ...components
    ],
    exports: [
        ...components
    ],
    entryComponents: [
        ClusterDeleteConfirmationComponent,
        NodeDeleteConfirmationComponent,
        UpgradeClusterComponent
    ],
    providers: [
        NodeDeleteConfirmationService
    ],
})
export class ClusterModule { }
