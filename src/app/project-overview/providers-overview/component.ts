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
import {Cluster, getProviderDisplayName, Provider} from '@shared/entity/cluster';
import _ from 'lodash';

class ChartData {
  name: string;
  value: number;
}

class ChartColorData {
  name: string;
  value: string;
}

@Component({
  selector: 'km-providers-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ProvidersOverviewComponent implements OnInit, OnChanges {
  @Input() clusters: Cluster[] = [];
  clusterDistribution: ChartData[] = [];
  colors: ChartColorData[] = [
    {name: getProviderDisplayName(Provider.Alibaba), value: '#444c53'},
    {name: getProviderDisplayName(Provider.Anexia), value: '#023ca7'},
    {name: getProviderDisplayName(Provider.AWS), value: '#ee8910'},
    {name: getProviderDisplayName(Provider.Azure), value: '#008ad7'},
    {name: getProviderDisplayName(Provider.kubeAdm), value: '#326ce5'},
    {name: getProviderDisplayName(Provider.Digitalocean), value: '#008bcf'},
    {name: getProviderDisplayName(Provider.GCP), value: '#32a350'},
    {name: getProviderDisplayName(Provider.Hetzner), value: '#d50c2dff'},
    {name: getProviderDisplayName(Provider.KubeVirt), value: '#00aab2'},
    {name: getProviderDisplayName(Provider.Nutanix), value: '#b0d236'},
    {name: getProviderDisplayName(Provider.OpenStack), value: '#e61742'},
    {name: getProviderDisplayName(Provider.Equinix), value: '#e51d26'},
    {name: getProviderDisplayName(Provider.VSphere), value: '#e5a900'},
  ];

  ngOnInit(): void {
    this.clusterDistribution = this._clusterDistribution;
  }

  ngOnChanges(): void {
    this.clusterDistribution = this._clusterDistribution;
  }

  private get _clusterDistribution(): ChartData[] {
    return Object.entries(_.countBy(this.clusters.map(c => Cluster.getProviderDisplayName(c)))).map(([k, v]) => ({
      name: k,
      value: v,
    }));
  }
}
