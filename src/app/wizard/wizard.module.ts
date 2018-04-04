import { NgModule } from '@angular/core';
import { WizardComponent } from './wizard.component';
import { ProgressComponent } from './progress/progress.component';
import { SetClusterNameComponent } from './set-cluster-name/set-cluster-name.component';
import { SetDatacenterComponent } from './set-datacenter/set-datacenter.component';
import { SetProviderComponent } from './set-provider/set-provider.component';
import { SetSettingsComponent } from './set-settings/set-settings.component';
import { SummaryComponent } from './summary/summary.component';
import { SharedModule } from '../shared/shared.module';
import { WizardRoutingModule } from './wizard-routing.module';
import { MatButtonToggleModule } from '@angular/material';
import { OpenstackClusterSettingsComponent } from './set-settings/provider-settings/openstack/openstack.component';
import { DigitaloceanClusterSettingsComponent } from './set-settings/provider-settings/digitalocean/digitalocean.component';
import { AWSClusterSettingsComponent } from './set-settings/provider-settings/aws/aws.component';
import { BringyourownClusterSettingsComponent } from './set-settings/provider-settings/bringyourown/bringyourown.component';
import { ClusterProviderSettingsComponent } from './set-settings/provider-settings/provider-settings.component';
import { ClusterSSHKeysComponent } from './set-settings/ssh-keys/cluster-ssh-keys.component';
import { AddNodeModule } from '../add-node/add-node.module';
import { HetznerClusterSettingsComponent } from './set-settings/provider-settings/hetzner/hetzner.component';

const components: any[] = [
  WizardComponent,
  ProgressComponent,
  SetClusterNameComponent,
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
];

@NgModule({
  imports: [
    SharedModule,
    WizardRoutingModule,
    MatButtonToggleModule,
    AddNodeModule,
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
