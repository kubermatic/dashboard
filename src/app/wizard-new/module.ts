import {NgModule} from '@angular/core';

import {MachineNetworksModule} from '../machine-networks/machine-networks.module';
import {NodeDataModule} from '../node-data/node-data.module';
import {SharedModule} from '../shared/shared.module';

import {WizardComponent} from './component';
import {Routing} from './routing';
import {ClusterStepComponent} from './step/cluster/component';
import {DatacenterStepComponent} from './step/datacenter/component';
import {MockStepComponent} from './step/mock/component';
import {ProviderStepComponent} from './step/provider/component';
import {SettingsStepComponent} from './step/settings/component';
import {PresetsComponent} from './step/settings/preset/component';
import {AWSProviderComponent} from './step/settings/provider/aws/component';

const components: any[] = [
  WizardComponent,
  PresetsComponent,
];

const entryComponents: any[] = [
  ClusterStepComponent,
  MockStepComponent,
  ProviderStepComponent,
  DatacenterStepComponent,
  SettingsStepComponent,
  AWSProviderComponent,
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
    ...entryComponents,
  ],
  exports: [
    ...components,
    ...entryComponents,
  ],
  entryComponents: [...entryComponents],
})
export class WizardModule {
}
