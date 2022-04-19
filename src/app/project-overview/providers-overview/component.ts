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

import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {Cluster} from '@shared/entity/cluster';
import _ from 'lodash';

class ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'km-providers-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ProvidersOverviewComponent implements OnInit, OnChanges {
  @Input() clusters: Cluster[] = [];
  clusterDistribution: ChartData[] = [];

  ngOnInit(): void {
    this.clusterDistribution = this._clusterDistribution;
  }

  ngOnChanges(): void {
    this.clusterDistribution = this._clusterDistribution;
  }

  private get _clusterDistribution(): ChartData[] {
    return Object.entries(_.countBy(this.clusters.map(c => Cluster.getProvider(c)))).map(([k, v]) => ({
      name: k,
      value: v,
    }));
  }
}
