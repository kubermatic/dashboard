// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {ParamsService} from '@core/services/params';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

@Component({
  selector: 'km-cluster-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterPanelComponent {
  @Input() cluster: Cluster | ExternalCluster;
  @Input() datacenter: Datacenter;
  @Input() projectID: string;

  private get _isExternalCluster(): boolean {
    return this._params.getCurrentUrl().includes('/external/');
  }

  get region(): string {
    if (
      !this.datacenter?.spec?.country ||
      !this.datacenter?.spec?.location ||
      this.datacenter?.spec?.provider === NodeProvider.BRINGYOUROWN
    ) {
      return undefined;
    }

    return `${this.datacenter.spec.country} (${this.datacenter.spec.location})`;
  }

  constructor(private readonly _router: Router, private readonly _params: ParamsService) {}

  goBack(): void {
    if (this._isExternalCluster) {
      this._router.navigate(['/projects/' + this.projectID + '/clusters/external/' + this.cluster.id]);
      return;
    }

    this._router.navigate(['/projects/' + this.projectID + '/clusters/' + this.cluster.id]);
  }
}
