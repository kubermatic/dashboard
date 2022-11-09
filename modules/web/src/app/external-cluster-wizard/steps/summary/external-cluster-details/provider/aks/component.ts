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

import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AKSClusterSpec, AKSCloudSpec} from '@shared/entity/provider/aks';
import {ExternalClusterModel} from '@shared/entity/external-cluster';

@Component({
  selector: 'km-aks-cluster-summary',
  templateUrl: './template.html',
})
export class AKSClusterSummaryComponent implements OnChanges {
  @Input() cluster: ExternalClusterModel;

  spec: AKSClusterSpec;
  cloudSpec: AKSCloudSpec;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.cluster) {
      this._init();
    }
  }

  private _init(): void {
    this.spec = this.cluster.spec.aksclusterSpec;
    this.cloudSpec = this.cluster.cloud.aks;
  }
}
