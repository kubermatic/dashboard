// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {SharedModule} from '@shared/module';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '../node-data/config';
import {Routing} from './routing';
import {NodeDataModule} from '../node-data/module';
import {ExternalClusterWizardComponent} from './component';
import {ExternalClusterStepComponent} from '@app/external-cluster-wizard/steps/external-cluster/component';
import {EKSExternalClusterComponent} from '@app/external-cluster-wizard/steps/external-cluster/provider/eks/component';
import {ExternalClusterWizardService} from '@core/services/wizard/external-cluster-wizard';

const components = [ExternalClusterWizardComponent, ExternalClusterStepComponent, EKSExternalClusterComponent];

@NgModule({
  imports: [SharedModule, Routing, NodeDataModule],
  declarations: [...components],
  providers: [
    {
      provide: NODE_DATA_CONFIG,
      useValue: {mode: NodeDataMode.Wizard} as NodeDataConfig,
    },
    ExternalClusterWizardService,
  ],
  exports: [...components],
})
export class ExternalClusterModule {}
