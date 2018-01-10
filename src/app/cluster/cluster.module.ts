import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { ClusterRoutingModule } from 'app/cluster/cluster-routing.module';
import { AddNodeModule } from 'app/add-node/add-node.module';

import { NodeDeleteConfirmationService } from 'app/cluster/cluster-details/node-delete-confirmation/node-delete-confirmation.service';

import { NodeComponent } from 'app/cluster/cluster-details/node/node.component';
import { NodeGroupComponent } from 'app/cluster/cluster-details/node-group/node-group.component';

import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { ClusterDetailsComponent } from 'app/cluster/cluster-details/cluster-details.component';
import { ClusterItemComponent } from './cluster-list/cluster-item/cluster-item.component';
import { ClusterHealthStatusComponent } from './cluster-health-status/cluster-health-status.component';

import { NodeDeleteConfirmationComponent } from 'app/cluster/cluster-details/node-delete-confirmation/node-delete-confirmation.component';
import { ClusterDeleteConfirmationComponent } from 'app/cluster/cluster-details/cluster-delete-confirmation/cluster-delete-confirmation.component';
import { AddNodeModalComponent } from './cluster-details/add-node-modal/add-node-modal.component';
import { UpgradeClusterComponent } from './cluster-details/upgrade-cluster/upgrade-cluster.component';
import { ClusterSecretsComponent } from './cluster-details/cluster-secrets/cluster-secrets.component';

const components: any[] = [
    ClusterDetailsComponent,
    NodeComponent,
    NodeGroupComponent,
    ClusterListComponent,
    ClusterItemComponent,
    ClusterHealthStatusComponent,
];

const entryComponents: any[] = [
    ClusterDeleteConfirmationComponent,
    NodeDeleteConfirmationComponent,
    UpgradeClusterComponent,
    AddNodeModalComponent,
    ClusterSecretsComponent
];

@NgModule({
    imports: [
        SharedModule,
        ClusterRoutingModule,
        AddNodeModule
    ],
    declarations: [
        ...components,
        ...entryComponents
    ],
    exports: [
        ...components
    ],
    entryComponents: [
        ...entryComponents
    ],
    providers: [
        NodeDeleteConfirmationService
    ],
})
export class ClusterModule { }
