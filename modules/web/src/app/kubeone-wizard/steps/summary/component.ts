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

import {Component} from '@angular/core';
import {StepRegistry} from '@app/kubeone-wizard/config';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {KubeOneClusterSpec} from '@shared/entity/kubeone-cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

@Component({
  selector: 'km-kubeone-wizard-summary-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class KubeOneSummaryStepComponent {
  readonly StepRegistry = StepRegistry;
  readonly SECRET_MASK = 'xxxx';

  constructor(private readonly _clusterSpecService: KubeOneClusterSpecService) {}

  get provider(): NodeProvider {
    return this._clusterSpecService.provider;
  }

  get cluster(): ExternalCluster {
    return this._clusterSpecService.cluster;
  }

  get kubeOneClusterSpec(): KubeOneClusterSpec {
    return this._clusterSpecService.cluster?.cloud?.kubeOne;
  }
}
