import {NgModule} from '@angular/core';

import {MachineNetworksModule} from '../machine-networks/machine-networks.module';
import {NodeDataModule} from '../node-data/node-data.module';
import {SharedModule} from '../shared/shared.module';

import {WizardComponent} from './component';
import {Routing} from './routing';
import {ClusterStepComponent} from './step/cluster/component';
import {MockStepComponent} from './step/mock/component';

const components: any[] = [
  WizardComponent,
];

const entryComponents: any[] = [
  ClusterStepComponent,
  MockStepComponent,
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
