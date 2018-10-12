import { NgModule } from '@angular/core';
import { MatTabsModule, MatButtonToggleModule } from '@angular/material';
import { WizardComponent } from './wizard.component';
import { ProgressComponent } from './progress/progress.component';
import { SetClusterSpecComponent } from './set-cluster-spec/set-cluster-spec.component';
import { SetDatacenterComponent } from './set-datacenter/set-datacenter.component';
import { SetProviderComponent } from './set-provider/set-provider.component';
import { SetSettingsComponent } from './set-settings/set-settings.component';
import { SummaryComponent } from './summary/summary.component';
import { OpenstackClusterSettingsComponent } from './set-settings/provider-settings/openstack/openstack.component';
import { DigitaloceanClusterSettingsComponent } from './set-settings/provider-settings/digitalocean/digitalocean.component';
import { AWSClusterSettingsComponent } from './set-settings/provider-settings/aws/aws.component';
import { BringyourownClusterSettingsComponent } from './set-settings/provider-settings/bringyourown/bringyourown.component';
import { ClusterProviderSettingsComponent } from './set-settings/provider-settings/provider-settings.component';
import { ClusterSSHKeysComponent } from './set-settings/ssh-keys/cluster-ssh-keys.component';
import { HetznerClusterSettingsComponent } from './set-settings/provider-settings/hetzner/hetzner.component';
import { VSphereClusterSettingsComponent } from './set-settings/provider-settings/vsphere/vsphere.component';
import { AzureClusterSettingsComponent } from './set-settings/provider-settings/azure/azure.component';
import { SharedModule } from '../shared/shared.module';
import { WizardRoutingModule } from './wizard-routing.module';
import { AddNodeModule } from '../add-node/add-node.module';
import { MachineNetworksModule } from '../machine-networks/machine-networks.module';

const components: any[] = [
  WizardComponent,
  ProgressComponent,
  SetClusterSpecComponent,
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
    MatButtonToggleModule,
    MatTabsModule,
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
