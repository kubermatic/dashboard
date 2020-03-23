import {NgModule} from '@angular/core';

import {MachineNetworksModule} from '../machine-networks/machine-networks.module';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '../node-data-new/config';
import {NodeDataModule} from '../node-data-new/module';
import {SharedModule} from '../shared/shared.module';

import {WizardComponent} from './component';
import {Routing} from './routing';
import {ClusterService} from './service/cluster';
import {WizardService} from './service/wizard';
import {ClusterStepComponent} from './step/cluster/component';
import {NodeSettingsStepComponent} from './step/node-settings/component';
import {ProviderStepComponent} from './step/provider-datacenter/component';
import {ProviderSettingsStepComponent} from './step/provider-settings/component';
import {PresetsComponent} from './step/provider-settings/preset/component';
import {AWSProviderBasicComponent} from './step/provider-settings/provider/basic/aws/component';
import {ProviderBasicComponent} from './step/provider-settings/provider/basic/component';
import {DigitalOceanProviderBasicComponent} from './step/provider-settings/provider/basic/digitalocean/component';
import {KubeVirtProviderBasicComponent} from './step/provider-settings/provider/basic/kubevirt/component';
import {VSphereProviderBasicComponent} from './step/provider-settings/provider/basic/vsphere/component';
import {AWSProviderExtendedComponent} from './step/provider-settings/provider/extended/aws/component';
import {ProviderExtendedComponent} from './step/provider-settings/provider/extended/component';
import {ClusterSSHKeysComponent} from './step/provider-settings/ssh-keys/component';
import {SummaryStepComponent} from './step/summary/component';

const components: any[] = [
  WizardComponent,
  PresetsComponent,
  ClusterStepComponent,
  SummaryStepComponent,
  ProviderStepComponent,
  ProviderSettingsStepComponent,
  ProviderBasicComponent,
  AWSProviderBasicComponent,
  DigitalOceanProviderBasicComponent,
  KubeVirtProviderBasicComponent,
  VSphereProviderBasicComponent,
  ProviderExtendedComponent,
  AWSProviderExtendedComponent,
  NodeSettingsStepComponent,
  ClusterSSHKeysComponent,
];

@NgModule({
  imports: [
    SharedModule,
    Routing,
    NodeDataModule,
    MachineNetworksModule,
  ],
  declarations: [
    ...components,
  ],
  providers: [
    {provide: NODE_DATA_CONFIG, useValue: {mode: NodeDataMode.Wizard} as NodeDataConfig},
    WizardService,
    ClusterService,
  ],
  exports: [
    ...components,
  ],
})
export class WizardModule {
}
