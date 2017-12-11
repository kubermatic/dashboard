import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { ClusterRoutingModule } from 'app/cluster/cluster-routing.module';
import { AddNodeModule } from 'app/add-node/add-node.module';

import { NodeDeleteConfirmationService } from 'app/cluster/node-delete-confirmation/node-delete-confirmation.service';

import { NodeComponent } from 'app/cluster/node/node.component';
import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { UpgradeClusterComponent } from './upgrade-cluster/upgrade-cluster.component';
import { ClusterComponent } from 'app/cluster/cluster.component';
import { NodeDeleteConfirmationComponent } from 'app/cluster/node-delete-confirmation/node-delete-confirmation.component';
import { ClusterDeleteConfirmationComponent } from 'app/cluster/cluster-delete-confirmation/cluster-delete-confirmation.component';
import { ClusterItemComponent } from './cluster-list/cluster-item/cluster-item.component';
import { ClusterHealthStatusComponent } from './cluster-health-status/cluster-health-status.component';
import { AddNodeModalComponent } from './add-node-modal/add-node-modal.component';

const components: any[] = [
    ClusterComponent,
    NodeComponent,
    ClusterListComponent,
    ClusterItemComponent,
    ClusterHealthStatusComponent,
];

@NgModule({
    imports: [
        SharedModule,
        ClusterRoutingModule,
        AddNodeModule
    ],
    declarations: [
        ...components,
        ClusterDeleteConfirmationComponent,
        NodeDeleteConfirmationComponent,
        UpgradeClusterComponent,
        AddNodeModalComponent
    ],
    exports: [
        ...components
    ],
    entryComponents: [
        ClusterDeleteConfirmationComponent,
        NodeDeleteConfirmationComponent,
        UpgradeClusterComponent,
        AddNodeModalComponent
    ],
    providers: [
        NodeDeleteConfirmationService
    ],
})
export class ClusterModule { }
