import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { ClusterRoutingModule } from 'app/cluster/cluster-routing.module';

import { NodeDeleteConfirmationService } from 'app/cluster/node-delete-confirmation/node-delete-confirmation.service';

import { NodeComponent } from 'app/cluster/node/node.component';
import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { UpgradeClusterComponent } from './upgrade-cluster/upgrade-cluster.component';
import { ClusterComponent } from 'app/cluster/cluster.component';
import { NodeDeleteConfirmationComponent } from 'app/cluster/node-delete-confirmation/node-delete-confirmation.component';
import { ClusterDeleteConfirmationComponent } from 'app/cluster/cluster-delete-confirmation/cluster-delete-confirmation.component';
import { ClusterItemComponent } from './cluster-list/cluster-item/cluster-item.component';
import { ClusterHealthStatusComponent } from './cluster-health-status/cluster-health-status.component';

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
        ClusterRoutingModule
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
