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
import {KubeOneClusterStepComponent} from '@app/kubeone-wizard/steps/cluster/component';
import {KubeOneCredentialsStepComponent} from '@app/kubeone-wizard/steps/credentials/component';
import {KubeOnePresetsComponent} from '@app/kubeone-wizard/steps/credentials/preset/component';
import {KubeOneAWSCredentialsBasicComponent} from '@app/kubeone-wizard/steps/credentials/provider/basic/aws/component';
import {KubeOneAzureCredentialsBasicComponent} from '@app/kubeone-wizard/steps/credentials/provider/basic/azure/component';
import {KubeOneCredentialsBasicComponent} from '@app/kubeone-wizard/steps/credentials/provider/basic/component';
import {KubeOneGCPCredentialsBasicComponent} from '@app/kubeone-wizard/steps/credentials/provider/basic/gcp/component';
import {KubeOneProviderStepComponent} from '@app/kubeone-wizard/steps/provider/component';
import {KubeOneSummaryStepComponent} from '@app/kubeone-wizard/steps/summary/component';
import {KubeOneWizardService} from '@core/services/kubeone-wizard/wizard';
import {SharedModule} from '@shared/module';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '../node-data/config';
import {KubeOneWizardComponent} from './component';
import {Routing} from './routing';
import {KubeOneDigitaloceanCredentialsBasicComponent} from './steps/credentials/provider/basic/digitalocean/component';

const components = [
  KubeOneWizardComponent,
  KubeOneProviderStepComponent,
  KubeOneCredentialsStepComponent,
  KubeOneCredentialsBasicComponent,
  KubeOneAWSCredentialsBasicComponent,
  KubeOneGCPCredentialsBasicComponent,
  KubeOneAzureCredentialsBasicComponent,
  KubeOneDigitaloceanCredentialsBasicComponent,
  KubeOneClusterStepComponent,
  KubeOneSummaryStepComponent,
  KubeOnePresetsComponent,
];

@NgModule({
  imports: [SharedModule, Routing],
  declarations: [...components],
  providers: [
    {
      provide: NODE_DATA_CONFIG,
      useValue: {mode: NodeDataMode.Wizard} as NodeDataConfig,
    },
    KubeOneWizardService,
  ],
  exports: [...components],
})
export class KubeOneWizardModule {}
