// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NgModule} from '@angular/core';

import {MachineNetworksModule} from '../machine-networks/machine-networks.module';
import {NodeDataModule} from '../node-data/node-data.module';
import {SharedModule} from '../shared/shared.module';

import {AddMachineNetworkComponent} from './cluster-details/add-machine-network/add-machine-network.component';
import {ChangeClusterVersionComponent} from './cluster-details/change-cluster-version/change-cluster-version.component';
import {ClusterDeleteConfirmationComponent} from './cluster-details/cluster-delete-confirmation/cluster-delete-confirmation.component';
import {ClusterDetailsComponent} from './cluster-details/cluster-details.component';
import {ClusterSecretsComponent} from './cluster-details/cluster-secrets/cluster-secrets.component';
import {EditClusterComponent} from './cluster-details/edit-cluster/edit-cluster.component';
import {AlibabaProviderSettingsComponent} from './cluster-details/edit-provider-settings/alibaba-provider-settings/alibaba-provider-settings.component';
import {AWSProviderSettingsComponent} from './cluster-details/edit-provider-settings/aws-provider-settings/aws-provider-settings.component';
import {AzureProviderSettingsComponent} from './cluster-details/edit-provider-settings/azure-provider-settings/azure-provider-settings.component';
import {DigitaloceanProviderSettingsComponent} from './cluster-details/edit-provider-settings/digitalocean-provider-settings/digitalocean-provider-settings.component';
import {EditProviderSettingsComponent} from './cluster-details/edit-provider-settings/edit-provider-settings.component';
import {GCPProviderSettingsComponent} from './cluster-details/edit-provider-settings/gcp-provider-settings/gcp-provider-settings.component';
import {HetznerProviderSettingsComponent} from './cluster-details/edit-provider-settings/hetzner-provider-settings/hetzner-provider-settings.component';
import {KubevirtProviderSettingsComponent} from './cluster-details/edit-provider-settings/kubevirt-provider-settings/kubevirt-provider-settings.component';
import {OpenstackProviderSettingsComponent} from './cluster-details/edit-provider-settings/openstack-provider-settings/openstack-provider-settings.component';
import {PacketProviderSettingsComponent} from './cluster-details/edit-provider-settings/packet-provider-settings/packet-provider-settings.component';
import {VSphereProviderSettingsComponent} from './cluster-details/edit-provider-settings/vsphere-provider-settings/vsphere-provider-settings.component';
import {AddClusterSSHKeysComponent} from './cluster-details/edit-sshkeys/add-cluster-sshkeys/add-cluster-sshkeys.component';
import {EditSSHKeysComponent} from './cluster-details/edit-sshkeys/edit-sshkeys.component';
import {MachineNetworksDisplayComponent} from './cluster-details/machine-networks-display/machine-networks-display.component';
import {NodeDataModalComponent} from './cluster-details/node-data-modal/node-data-modal.component';
import {ClusterPanelComponent} from './cluster-details/node-deployment-details/cluster-panel/cluster-panel.component';
import {NodeDeploymentDetailsComponent} from './cluster-details/node-deployment-details/node-deployment-details.component';
import {NodeDeploymentListComponent} from './cluster-details/node-deployment-list/node-deployment-list.component';
import {NodeListComponent} from './cluster-details/node-list/node-list.component';
import {AddBindingComponent} from './cluster-details/rbac/add-binding/add-binding.component';
import {RBACComponent} from './cluster-details/rbac/rbac.component';
import {RevokeTokenComponent} from './cluster-details/revoke-token/revoke-token.component';
import {ShareKubeconfigComponent} from './cluster-details/share-kubeconfig/share-kubeconfig.component';
import {VersionPickerComponent} from './cluster-details/version-picker/version-picker.component';
import {ClusterListComponent} from './cluster-list/cluster-list.component';
import {ClusterRoutingModule} from './cluster-routing.module';
import {NodeService} from './services/node.service';

const components: any[] = [
  ClusterDetailsComponent,
  NodeListComponent,
  NodeDeploymentListComponent,
  NodeDeploymentDetailsComponent,
  ClusterListComponent,
  MachineNetworksDisplayComponent,
  RBACComponent,
];

const entryComponents: any[] = [
  ClusterDeleteConfirmationComponent,
  ChangeClusterVersionComponent,
  NodeDataModalComponent,
  ClusterSecretsComponent,
  EditClusterComponent,
  RevokeTokenComponent,
  AddMachineNetworkComponent,
  EditProviderSettingsComponent,
  AWSProviderSettingsComponent,
  DigitaloceanProviderSettingsComponent,
  HetznerProviderSettingsComponent,
  GCPProviderSettingsComponent,
  OpenstackProviderSettingsComponent,
  VSphereProviderSettingsComponent,
  AzureProviderSettingsComponent,
  PacketProviderSettingsComponent,
  KubevirtProviderSettingsComponent,
  AlibabaProviderSettingsComponent,
  EditSSHKeysComponent,
  AddClusterSSHKeysComponent,
  ShareKubeconfigComponent,
  ClusterPanelComponent,
  AddBindingComponent,
];

@NgModule({
  imports: [SharedModule, ClusterRoutingModule, MachineNetworksModule, NodeDataModule],
  declarations: [...components, ...entryComponents, VersionPickerComponent],
  exports: [...components],
  entryComponents: [...entryComponents],
  providers: [NodeService],
})
export class ClusterModule {}
