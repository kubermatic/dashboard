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
import {DatacenterStepComponent} from './step/datacenter/component';
import {ProviderStepComponent} from './step/provider/component';
import {SettingsStepComponent} from './step/settings/component';
import {PresetsComponent} from './step/settings/preset/component';
import {AWSProviderBasicComponent} from './step/settings/provider/basic/aws/component';
import {ProviderBasicComponent} from './step/settings/provider/basic/component';
import {AWSProviderExtendedComponent} from './step/settings/provider/extended/aws/component';
import {ProviderExtendedComponent} from './step/settings/provider/extended/component';
import {SummaryStepComponent} from './step/summary/component';

const components: any[] = [
  WizardComponent,
  PresetsComponent,
  ClusterStepComponent,
  SummaryStepComponent,
  ProviderStepComponent,
  DatacenterStepComponent,
  SettingsStepComponent,
  ProviderBasicComponent,
  AWSProviderBasicComponent,
  ProviderExtendedComponent,
  AWSProviderExtendedComponent,
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
