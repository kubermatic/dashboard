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
import {AddMachineNetworkComponent} from '@app/cluster/cluster-details/add-machine-network/component';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '@app/node-data/config';
import {NodeDataModule} from '@app/node-data/module';
import {NodeService} from '@core/services/node';
import {SharedModule} from '@shared/module';
import {MachineNetworksModule} from '../machine-networks/module';
import {AlertmanagerConfigComponent} from './cluster-details/alertmanager-config/component';
import {AlertmanagerConfigDialog} from './cluster-details/alertmanager-config/alertmanager-config-dialog/component';
import {ChangeClusterVersionComponent} from './cluster-details/change-cluster-version/component';
import {ClusterDeleteConfirmationComponent} from './cluster-details/cluster-delete-confirmation/component';
import {ClusterSecretsComponent} from './cluster-details/cluster-secrets/component';
import {ClusterDetailsComponent} from './cluster-details/component';
import {ConstraintsComponent} from './cluster-details/constraints/component';
import {ConstraintDialog} from './cluster-details/constraints/constraint-dialog/component';
import {ViolationDetailsComponent} from './cluster-details/constraints/violation-details/component';
import {EditClusterComponent} from './cluster-details/edit-cluster/component';
import {AlibabaProviderSettingsComponent} from './cluster-details/edit-provider-settings/alibaba-provider-settings/component';
import {AWSProviderSettingsComponent} from './cluster-details/edit-provider-settings/aws-provider-settings/component';
import {AzureProviderSettingsComponent} from './cluster-details/edit-provider-settings/azure-provider-settings/component';
import {EditProviderSettingsComponent} from './cluster-details/edit-provider-settings/component';
import {DigitaloceanProviderSettingsComponent} from './cluster-details/edit-provider-settings/digitalocean-provider-settings/component';
import {GCPProviderSettingsComponent} from './cluster-details/edit-provider-settings/gcp-provider-settings/component';
import {HetznerProviderSettingsComponent} from './cluster-details/edit-provider-settings/hetzner-provider-settings/component';
import {KubevirtProviderSettingsComponent} from './cluster-details/edit-provider-settings/kubevirt-provider-settings/component';
import {OpenstackProviderSettingsComponent} from './cluster-details/edit-provider-settings/openstack-provider-settings/component';
import {PacketProviderSettingsComponent} from './cluster-details/edit-provider-settings/packet-provider-settings/component';
import {VSphereProviderSettingsComponent} from './cluster-details/edit-provider-settings/vsphere-provider-settings/component';
import {EditSSHKeysComponent} from './cluster-details/edit-sshkeys/component';
import {GatekeeperConfigComponent} from './cluster-details/gatekeeper-config/component';
import {GatekeeperConfigDialog} from './cluster-details/gatekeeper-config/gatekeeper-config-dialog/component';
import {ClusterPanelComponent} from './cluster-details/machine-deployment-details/cluster-panel/component';
import {MachineDeploymentDetailsComponent} from './cluster-details/machine-deployment-details/component';
import {MachineDeploymentListComponent} from './cluster-details/machine-deployment-list/component';
import {MachineNetworksDisplayComponent} from './cluster-details/machine-networks-display/component';
import {NodeListComponent} from './cluster-details/node-list/component';
import {AddBindingComponent} from './cluster-details/rbac/add-binding/component';
import {RBACComponent} from './cluster-details/rbac/component';
import {RevokeTokenComponent} from './cluster-details/revoke-token/component';
import {RuleGroupsComponent} from './cluster-details/rule-groups/component';
import {RuleGroupDialog} from './cluster-details/rule-groups/rule-group-dialog/component';
import {ShareKubeconfigComponent} from './cluster-details/share-kubeconfig/component';
import {VersionPickerComponent} from './cluster-details/version-picker/component';
import {ClusterListComponent} from './cluster-list/component';
import {ExternalClusterDetailsComponent} from './external-cluster-details/component';
import {ExternalNodeListComponent} from './external-cluster-details/external-node-list/component';
import {ClusterRoutingModule} from './routing';

const components: any[] = [
  ClusterDetailsComponent,
  ExternalClusterDetailsComponent,
  ExternalNodeListComponent,
  NodeListComponent,
  MachineDeploymentListComponent,
  MachineDeploymentDetailsComponent,
  ClusterListComponent,
  MachineNetworksDisplayComponent,
  RBACComponent,
  ClusterDeleteConfirmationComponent,
  ChangeClusterVersionComponent,
  ClusterSecretsComponent,
  EditClusterComponent,
  RevokeTokenComponent,
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
  ShareKubeconfigComponent,
  ClusterPanelComponent,
  AddBindingComponent,
  VersionPickerComponent,
  ConstraintsComponent,
  ConstraintDialog,
  ViolationDetailsComponent,
  GatekeeperConfigComponent,
  GatekeeperConfigDialog,
  AlertmanagerConfigComponent,
  AlertmanagerConfigDialog,
  RuleGroupsComponent,
  RuleGroupDialog,
];

const dialogs: any[] = [AddMachineNetworkComponent];

@NgModule({
  imports: [SharedModule, ClusterRoutingModule, MachineNetworksModule, NodeDataModule],
  declarations: [...components, ...dialogs],
  exports: [...components],
  providers: [
    NodeService,
    {
      provide: NODE_DATA_CONFIG,
      useValue: {mode: NodeDataMode.Dialog} as NodeDataConfig,
    },
  ],
})
export class ClusterModule {}
