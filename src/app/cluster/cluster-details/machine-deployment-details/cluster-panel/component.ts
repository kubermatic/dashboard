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
import {Cluster} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';

@Component({
  selector: 'km-cluster-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterPanelComponent {
  @Input() cluster: Cluster;
  @Input() datacenter: Datacenter;
  @Input() projectID: string;

  constructor(private readonly _router: Router) {}

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return Cluster.getVersionHeadline(type, isKubelet);
  }

  navigate(): void {
    this._router.navigate(['/projects/' + this.projectID + '/clusters/' + this.cluster.id]);
  }
}
