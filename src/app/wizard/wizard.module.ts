import {NgModule} from '@angular/core';

import {MachineNetworksModule} from '../machine-networks/machine-networks.module';
import {NodeDataModule} from '../node-data/node-data.module';
import {SharedModule} from '../shared/shared.module';

import {ProgressComponent} from './progress/progress.component';
import {SetClusterSpecComponent} from './set-cluster-spec/set-cluster-spec.component';
import {SetDatacenterComponent} from './set-datacenter/set-datacenter.component';
import {SetMachineNetworksComponent} from './set-machine-networks/set-machine-networks.component';
import {SetProviderComponent} from './set-provider/set-provider.component';
import {CustomPresetsSettingsComponent} from './set-settings/custom-credentials/custom-presets.component';
import {AWSClusterSettingsComponent} from './set-settings/provider-settings/aws/aws.component';
import {AzureClusterSettingsComponent} from './set-settings/provider-settings/azure/azure.component';
import {BringyourownClusterSettingsComponent} from './set-settings/provider-settings/bringyourown/bringyourown.component';
import {DigitaloceanClusterSettingsComponent} from './set-settings/provider-settings/digitalocean/digitalocean.component';
import {GCPClusterSettingsComponent} from './set-settings/provider-settings/gcp/gcp.component';
import {HetznerClusterSettingsComponent} from './set-settings/provider-settings/hetzner/hetzner.component';
import {KubeVirtClusterSettingsComponent} from './set-settings/provider-settings/kubevirt/kubevirt.component';
import {OpenstackClusterSettingsComponent} from './set-settings/provider-settings/openstack/openstack.component';
import {PacketClusterSettingsComponent} from './set-settings/provider-settings/packet/packet.component';
import {ClusterProviderSettingsComponent} from './set-settings/provider-settings/provider-settings.component';
import {VSphereClusterSettingsComponent} from './set-settings/provider-settings/vsphere/vsphere.component';
import {SetSettingsComponent} from './set-settings/set-settings.component';
import {ClusterSSHKeysComponent} from './set-settings/ssh-keys/cluster-ssh-keys.component';
import {SummaryComponent} from './summary/summary.component';
import {WizardRoutingModule} from './wizard-routing.module';
import {WizardComponent} from './wizard.component';

const components: any[] = [
  WizardComponent,
  ProgressComponent,
  SetClusterSpecComponent,
  SetMachineNetworksComponent,
  SetDatacenterComponent,
  SetProviderComponent,
  SetSettingsComponent,
  ClusterSSHKeysComponent,
  SummaryComponent,
  ClusterProviderSettingsComponent,
  OpenstackClusterSettingsComponent,
  DigitaloceanClusterSettingsComponent,
  PacketClusterSettingsComponent,
  AWSClusterSettingsComponent,
  BringyourownClusterSettingsComponent,
  HetznerClusterSettingsComponent,
  VSphereClusterSettingsComponent,
  AzureClusterSettingsComponent,
  GCPClusterSettingsComponent,
  CustomPresetsSettingsComponent,
  KubeVirtClusterSettingsComponent,
];

@NgModule({
  imports: [
    SharedModule,
    WizardRoutingModule,
    NodeDataModule,
    MachineNetworksModule,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
  entryComponents: [],
})
export class WizardModule {
}
