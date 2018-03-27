import { NgModule } from '@angular/core';

import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { ClusterItemComponent } from './cluster-list/cluster-item/cluster-item.component';
import { ClusterHealthStatusComponent } from './cluster-health-status/cluster-health-status.component';

import { AddNodeModalComponent } from './cluster-details/add-node-modal/add-node-modal.component';
import { UpgradeClusterComponent } from './cluster-details/upgrade-cluster/upgrade-cluster.component';
import { ClusterSecretsComponent } from './cluster-details/cluster-secrets/cluster-secrets.component';
import { ClusterConnectComponent } from './cluster-details/cluster-connect/cluster-connect.component';
import { ClusterDetailsComponent } from './cluster-details/cluster-details.component';
import { NodeListComponent } from './cluster-details/node-list/node-list.component';
import { NodeGroupComponent } from './cluster-details/node-group/node-group.component';
import { ClusterDeleteConfirmationComponent } from './cluster-details/cluster-delete-confirmation/cluster-delete-confirmation.component';
import { NodeDeleteConfirmationComponent } from './cluster-details/node-delete-confirmation/node-delete-confirmation.component';
import { SharedModule } from '../shared/shared.module';
import { ClusterRoutingModule } from './cluster-routing.module';
import { AddNodeModule } from '../add-node/add-node.module';
import { NodeDeleteConfirmationService } from './cluster-details/node-delete-confirmation/node-delete-confirmation.service';
import { RevokeAdminTokenComponent } from './cluster-details/cluster-secrets/revoke-admin-token/revoke-admin-token.component';

const components: any[] = [
    ClusterDetailsComponent,
    NodeListComponent,
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
    ClusterSecretsComponent,
    ClusterConnectComponent,
    RevokeAdminTokenComponent,
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
