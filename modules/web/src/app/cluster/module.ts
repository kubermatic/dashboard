// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NgModule} from '@angular/core';
import {AddMachineNetworkComponent} from '@app/cluster/details/cluster/add-machine-network/component';
import {AnexiaProviderSettingsComponent} from '@app/cluster/details/cluster/edit-provider-settings/anexia-provider-settings/component';
import {BaremetalProviderSettingsComponent} from '@app/cluster/details/cluster/edit-provider-settings/baremetal-provider-settings/component';
import {CopyJoiningScriptButtonComponent} from '@app/cluster/details/cluster/machine-deployment-details/copy-joining-script-button/component';
import {ExternalMachineDeploymentDetailsComponent} from '@app/cluster/details/external-cluster/external-machine-deployment-details/component';
import {ExternalAddMachineDeploymentDialogComponent} from '@app/cluster/details/external-cluster/external-cluster-add-machine-deployment/component';
import {ExternalMachineDeploymentListComponent} from '@app/cluster/details/external-cluster/external-machine-deployment-list/component';
import {KubeOneClusterDetailsComponent} from '@app/cluster/details/kubeone/component';
import {KubeOneMachineDeploymentDetailsComponent} from '@app/cluster/details/kubeone/machine-deployment-details/component';
import {KubeOneMachineDeploymentDialogComponent} from '@app/cluster/details/kubeone/machine-deployment-dialog/component';
import {KubeOneMachineDeploymentListComponent} from '@app/cluster/details/kubeone/machine-deployment-list/component';
import {ClusterMetricsComponent} from '@app/cluster/details/shared/cluster-metrics/component';
import {KubeOneClusterListComponent} from '@app/cluster/list/kubeone/component';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '@app/node-data/config';
import {NodeDataModule} from '@app/node-data/module';
import {NodeService} from '@core/services/node';
import {SharedModule} from '@shared/module';
import {MachineNetworksModule} from '../machine-networks/module';
import {AlertmanagerConfigComponent} from './details/cluster/mla/alertmanager-config/component';
import {AlertmanagerConfigDialog} from './details/cluster/mla/alertmanager-config/alertmanager-config-dialog/component';
import {VersionChangeDialogComponent} from './details/shared/version-change-dialog/component';
import {ClusterDeleteConfirmationComponent} from './details/cluster/cluster-delete-confirmation/component';
import {ClusterDetailsComponent} from './details/cluster/component';
import {CNIVersionComponent} from './details/cluster/cni-version/component';
import {CNIVersionDialog} from './details/cluster/cni-version/cni-version-dialog/component';
import {ConstraintsComponent} from './details/cluster/constraints/component';
import {ConstraintDialog} from './details/cluster/constraints/constraint-dialog/component';
import {ViolationDetailsComponent} from './details/cluster/constraints/violation-details/component';
import {EditClusterComponent} from './details/cluster/edit-cluster/component';
import {AlibabaProviderSettingsComponent} from './details/cluster/edit-provider-settings/alibaba-provider-settings/component';
import {AWSProviderSettingsComponent} from './details/cluster/edit-provider-settings/aws-provider-settings/component';
import {AzureProviderSettingsComponent} from './details/cluster/edit-provider-settings/azure-provider-settings/component';
import {EditProviderSettingsComponent} from './details/cluster/edit-provider-settings/component';
import {DigitaloceanProviderSettingsComponent} from './details/cluster/edit-provider-settings/digitalocean-provider-settings/component';
import {GCPProviderSettingsComponent} from './details/cluster/edit-provider-settings/gcp-provider-settings/component';
import {HetznerProviderSettingsComponent} from './details/cluster/edit-provider-settings/hetzner-provider-settings/component';
import {KubevirtProviderSettingsComponent} from './details/cluster/edit-provider-settings/kubevirt-provider-settings/component';
import {OpenstackProviderSettingsComponent} from './details/cluster/edit-provider-settings/openstack-provider-settings/component';
import {EquinixProviderSettingsComponent} from './details/cluster/edit-provider-settings/equinix-provider-settings/component';
import {VSphereProviderSettingsComponent} from './details/cluster/edit-provider-settings/vsphere-provider-settings/component';
import {EditSSHKeysComponent} from './details/cluster/edit-sshkeys/component';
import {GatekeeperConfigComponent} from './details/cluster/gatekeeper-config/component';
import {GatekeeperConfigDialog} from './details/cluster/gatekeeper-config/gatekeeper-config-dialog/component';
import {ClusterPanelComponent} from './details/shared/cluster-panel/component';
import {MachineDeploymentDetailsComponent} from './details/cluster/machine-deployment-details/component';
import {MachineDeploymentListComponent} from './details/cluster/machine-deployment-list/component';
import {MachineNetworksDisplayComponent} from './details/cluster/machine-networks-display/component';
import {MLAComponent} from './details/cluster/mla/component';
import {NodeListComponent} from './details/cluster/node-list/component';
import {AddBindingDialogComponent} from './details/cluster/rbac/add-binding-dialog/component';
import {RBACComponent} from './details/cluster/rbac/component';
import {RevokeTokenComponent} from './details/cluster/revoke-token/component';
import {RuleGroupsComponent} from './details/cluster/mla/rule-groups/component';
import {RuleGroupDialog} from './details/cluster/mla/rule-groups/rule-group-dialog/component';
import {ShareKubeconfigComponent} from './details/cluster/share-kubeconfig/component';
import {VersionPickerComponent} from './details/shared/version-picker/component';
import {ClusterListComponent} from './list/cluster/component';
import {ExternalClusterDetailsComponent} from './details/external-cluster/component';
import {ExternalNodeListComponent} from './details/external-cluster/external-node-list/component';
import {ClusterRoutingModule} from './routing';
import {ExternalClusterListComponent} from '@app/cluster/list/external-cluster/component';
import {ClustersComponent} from '@app/cluster/list/component';
import {NutanixProviderSettingsComponent} from '@app/cluster/details/cluster/edit-provider-settings/nutanix-provider-settings/component';
import {VMwareCloudDirectorProviderSettingsComponent} from '@app/cluster/details/cluster/edit-provider-settings/vmware-cloud-director-provider-settings/component';
import {ExternalClusterDeleteConfirmationComponent} from '@app/cluster/details/external-cluster/external-cluster-delete-confirmation/component';
import {UpdateExternalClusterMachineDeploymentDialogComponent} from '@app/cluster/details/external-cluster/update-external-cluster-machine-deployment-dialog/component';
import {ExternalClusterModule} from '@app/external-cluster-wizard/module';
import {ExternalMachineDeploymentService} from '@app/core/services/external-machine-deployment';
import {WebTerminalComponent} from '@app/cluster/details/cluster/web-terminal/component';
import {OverlayTerminalComponent} from '@app/cluster/details/cluster/overlay-terminal/component';
import {AddServiceAccountDialogComponent} from './details/cluster/rbac/add-service-account-dialog/component';
import {RBACServiceAccountComponent} from './details/cluster/rbac/service-account/component';
import {AddServiceAccountBindingDialogComponent} from './details/cluster/rbac/add-service-account-binding-dialog/component';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {RBACServiceAccountDetailsComponent} from './details/cluster/rbac/service-account/service-account-detail/component';
import {RBACUsersOrGroupsComponent} from './details/cluster/rbac/users-or-groups/component';
import {KyvernoClusterPoliciesListComponent} from '@app/dynamic/enterprise/kyverno-policies/cluster-policies/component';

const components: any[] = [
  ClusterDetailsComponent,
  ExternalClusterDetailsComponent,
  ExternalNodeListComponent,
  ExternalMachineDeploymentListComponent,
  ExternalMachineDeploymentDetailsComponent,
  ExternalAddMachineDeploymentDialogComponent,
  NodeListComponent,
  MachineDeploymentListComponent,
  MachineDeploymentDetailsComponent,
  ClusterListComponent,
  MachineNetworksDisplayComponent,
  RBACComponent,
  ClusterDeleteConfirmationComponent,
  ExternalClusterDeleteConfirmationComponent,
  VersionChangeDialogComponent,
  EditClusterComponent,
  RevokeTokenComponent,
  EditProviderSettingsComponent,
  AWSProviderSettingsComponent,
  NutanixProviderSettingsComponent,
  AnexiaProviderSettingsComponent,
  DigitaloceanProviderSettingsComponent,
  HetznerProviderSettingsComponent,
  GCPProviderSettingsComponent,
  OpenstackProviderSettingsComponent,
  VSphereProviderSettingsComponent,
  AzureProviderSettingsComponent,
  EquinixProviderSettingsComponent,
  KubevirtProviderSettingsComponent,
  AlibabaProviderSettingsComponent,
  VMwareCloudDirectorProviderSettingsComponent,
  BaremetalProviderSettingsComponent,
  EditSSHKeysComponent,
  ShareKubeconfigComponent,
  ClusterPanelComponent,
  AddBindingDialogComponent,
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
  MLAComponent,
  CNIVersionComponent,
  CNIVersionDialog,
  ExternalClusterListComponent,
  ClustersComponent,
  UpdateExternalClusterMachineDeploymentDialogComponent,
  WebTerminalComponent,
  OverlayTerminalComponent,
  KubeOneClusterListComponent,
  KubeOneClusterDetailsComponent,
  KubeOneMachineDeploymentListComponent,
  KubeOneMachineDeploymentDetailsComponent,
  KubeOneMachineDeploymentDialogComponent,
  ClusterMetricsComponent,
  AddServiceAccountDialogComponent,
  AddServiceAccountBindingDialogComponent,
  RBACServiceAccountComponent,
  RBACServiceAccountDetailsComponent,
  RBACUsersOrGroupsComponent,
  CopyJoiningScriptButtonComponent,
  KyvernoClusterPoliciesListComponent,
];

@NgModule({
  imports: [SharedModule, ClusterRoutingModule, MachineNetworksModule, NodeDataModule, ExternalClusterModule],
  declarations: [...components, AddMachineNetworkComponent],
  exports: [...components],
  providers: [
    NodeService,
    ExternalMachineDeploymentService,
    ClusterServiceAccountService,
    {
      provide: NODE_DATA_CONFIG,
      useValue: {mode: NodeDataMode.Dialog} as NodeDataConfig,
    },
  ],
})
export class ClusterModule {}
