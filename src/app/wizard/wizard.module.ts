import { NgModule } from '@angular/core';
import { MatButtonToggleModule, MatTabsModule } from '@angular/material';
import { AddNodeModule } from '../add-node/add-node.module';
import { MachineNetworksModule } from '../machine-networks/machine-networks.module';
import { SharedModule } from '../shared/shared.module';
import { ProgressComponent } from './progress/progress.component';
import { SetClusterSpecComponent } from './set-cluster-spec/set-cluster-spec.component';
import { SetDatacenterComponent } from './set-datacenter/set-datacenter.component';
import { SetMachineNetworksComponent } from './set-machine-networks/set-machine-networks.component';
import { SetProviderComponent } from './set-provider/set-provider.component';
import { AWSClusterSettingsComponent } from './set-settings/provider-settings/aws/aws.component';
import { AzureClusterSettingsComponent } from './set-settings/provider-settings/azure/azure.component';
import { BringyourownClusterSettingsComponent } from './set-settings/provider-settings/bringyourown/bringyourown.component';
import { DigitaloceanClusterSettingsComponent } from './set-settings/provider-settings/digitalocean/digitalocean.component';
import { HetznerClusterSettingsComponent } from './set-settings/provider-settings/hetzner/hetzner.component';
import { OpenstackClusterSettingsComponent } from './set-settings/provider-settings/openstack/openstack.component';
import { ClusterProviderSettingsComponent } from './set-settings/provider-settings/provider-settings.component';
import { VSphereClusterSettingsComponent } from './set-settings/provider-settings/vsphere/vsphere.component';
import { SetSettingsComponent } from './set-settings/set-settings.component';
import { ClusterSSHKeysComponent } from './set-settings/ssh-keys/cluster-ssh-keys.component';
import { SummaryComponent } from './summary/summary.component';
import { WizardRoutingModule } from './wizard-routing.module';
import { WizardComponent } from './wizard.component';

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
  AWSClusterSettingsComponent,
  BringyourownClusterSettingsComponent,
  HetznerClusterSettingsComponent,
  VSphereClusterSettingsComponent,
  AzureClusterSettingsComponent
];

@NgModule({
  imports: [
    SharedModule,
    WizardRoutingModule,
    AddNodeModule,
    MachineNetworksModule
  ],
  declarations: [
    ...components
  ],
  exports: [
    ...components
  ],
  entryComponents: []
})
export class WizardModule {
}
