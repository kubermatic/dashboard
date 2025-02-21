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
import {ActivatedRoute, Router} from '@angular/router';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

@Component({
    selector: 'km-cluster-panel',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class ClusterPanelComponent {
  @Input() cluster: Cluster | ExternalCluster;
  @Input() datacenter: Datacenter;
  @Input() projectID: string;

  constructor(
    private readonly _router: Router,
    private _route: ActivatedRoute
  ) {}

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

  goBack(): void {
    this._router.navigate(['../../'], {relativeTo: this._route});
  }
}
