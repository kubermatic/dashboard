import {NgModule} from '@angular/core';
import {MatTabsModule} from '@angular/material';

import {NodeDataModule} from '../node-data/node-data.module';
import {SharedModule} from '../shared/shared.module';

import {AddNodesModalComponent} from './cluster-details/add-nodes-modal/add-nodes-modal.component';
import {ChangeClusterVersionComponent} from './cluster-details/change-cluster-version/change-cluster-version.component';
import {ClusterConnectComponent} from './cluster-details/cluster-connect/cluster-connect.component';
import {ClusterDeleteConfirmationComponent} from './cluster-details/cluster-delete-confirmation/cluster-delete-confirmation.component';
import {ClusterDetailsComponent} from './cluster-details/cluster-details.component';
import {ClusterSecretsComponent} from './cluster-details/cluster-secrets/cluster-secrets.component';
import {RevokeAdminTokenComponent} from './cluster-details/cluster-secrets/revoke-admin-token/revoke-admin-token.component';
import {AWSProviderSettingsComponent} from './cluster-details/edit-provider-settings/aws-provider-settings/aws-provider-settings.component';
import {AzureProviderSettingsComponent} from './cluster-details/edit-provider-settings/azure-provider-settings/azure-provider-settings.component';
import {DigitaloceanProviderSettingsComponent} from './cluster-details/edit-provider-settings/digitalocean-provider-settings/digitalocean-provider-settings.component';
import {EditProviderSettingsComponent} from './cluster-details/edit-provider-settings/edit-provider-settings.component';
import {HetznerProviderSettingsComponent} from './cluster-details/edit-provider-settings/hetzner-provider-settings/hetzner-provider-settings.component';
import {OpenstackProviderSettingsComponent} from './cluster-details/edit-provider-settings/openstack-provider-settings/openstack-provider-settings.component';
import {VSphereProviderSettingsComponent} from './cluster-details/edit-provider-settings/vsphere-provider-settings/vsphere-provider-settings.component';
import {AddClusterSSHKeysComponent} from './cluster-details/edit-sshkeys/add-cluster-sshkeys/add-cluster-sshkeys.component';
import {EditSSHKeyDeleteConfirmationComponent} from './cluster-details/edit-sshkeys/edit-sshkey-delete-confirmation/edit-sshkey-delete-confirmation.component';
import {EditSSHKeysItemComponent} from './cluster-details/edit-sshkeys/edit-sshkeys-item/edit-sshkeys-item.component';
import {EditSSHKeysComponent} from './cluster-details/edit-sshkeys/edit-sshkeys.component';
import {NodeDeleteConfirmationComponent} from './cluster-details/node-delete-confirmation/node-delete-confirmation.component';
import {NodeDeleteConfirmationService} from './cluster-details/node-delete-confirmation/node-delete-confirmation.service';
import {NodeDeploymentListComponent} from './cluster-details/node-deployment-list/node-deployment-list.component';
import {NodeListComponent} from './cluster-details/node-list/node-list.component';
import {ShareKubeconfigComponent} from './cluster-details/share-kubeconfig/share-kubeconfig.component';
import {ClusterHealthStatusComponent} from './cluster-health-status/cluster-health-status.component';
import {ClusterItemComponent} from './cluster-list/cluster-item/cluster-item.component';
import {ClusterListComponent} from './cluster-list/cluster-list.component';
import {ClusterRoutingModule} from './cluster-routing.module';

const components: any[] = [
  ClusterDetailsComponent,
  NodeListComponent,
  NodeDeploymentListComponent,
  ClusterListComponent,
  ClusterItemComponent,
  ClusterHealthStatusComponent,
];

const entryComponents: any[] = [
  ClusterDeleteConfirmationComponent,
  NodeDeleteConfirmationComponent,
  ChangeClusterVersionComponent,
  AddNodesModalComponent,
  ClusterSecretsComponent,
  ClusterConnectComponent,
  RevokeAdminTokenComponent,
  EditProviderSettingsComponent,
  AWSProviderSettingsComponent,
  DigitaloceanProviderSettingsComponent,
  HetznerProviderSettingsComponent,
  OpenstackProviderSettingsComponent,
  VSphereProviderSettingsComponent,
  AzureProviderSettingsComponent,
  EditSSHKeysComponent,
  EditSSHKeysItemComponent,
  EditSSHKeyDeleteConfirmationComponent,
  AddClusterSSHKeysComponent,
  ShareKubeconfigComponent,
];

@NgModule({
  imports: [
    SharedModule,
    ClusterRoutingModule,
    MatTabsModule,
    NodeDataModule,
  ],
  declarations: [
    ...components,
    ...entryComponents,
  ],
  exports: [
    ...components,
  ],
  entryComponents: [
    ...entryComponents,
  ],
  providers: [
    NodeDeleteConfirmationService,
  ],
})
export class ClusterModule {
}
