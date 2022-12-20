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

import {Injectable} from '@angular/core';
import {ExternalCloudSpec, ExternalCluster} from '@shared/entity/external-cluster';
import {KubeOneCloudSpec, KubeOneClusterSpec} from '@shared/entity/kubeone-cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import _ from 'lodash';
import {Subject} from 'rxjs';

@Injectable()
export class KubeOneClusterSpecService {
  readonly providerChanges = new Subject<NodeProvider>();
  readonly clusterChanges = new Subject<ExternalCluster>();

  private _cluster: ExternalCluster = ExternalCluster.newEmptyKubeOneClusterEntity();

  get cluster(): ExternalCluster {
    return this._cluster;
  }

  set cluster(cluster: ExternalCluster) {
    if (
      this.getProvider(this._cluster) !== NodeProvider.NONE &&
      this.getProvider(cluster) !== NodeProvider.NONE &&
      this.getProvider(this._cluster) !== this.getProvider(cluster)
    ) {
      return;
    }

    this._cluster = _.mergeWith(this._cluster, cluster, (dest, src) =>
      _.isArray(dest) && _.isArray(src) ? dest : undefined
    );

    this.clusterChanges.next(this._cluster);
  }

  get provider(): NodeProvider {
    return this.getProvider(this._cluster);
  }

  set provider(provider: NodeProvider) {
    this._cluster.cloud.kubeOne.cloudSpec = {} as KubeOneCloudSpec;
    this.cluster = {
      cloud: {
        kubeOne: {
          cloudSpec: {} as KubeOneCloudSpec,
        } as KubeOneClusterSpec,
      } as ExternalCloudSpec,
    } as ExternalCluster;
    this.cluster.cloud.kubeOne.cloudSpec[provider] = {};

    if (provider) {
      this.providerChanges.next(provider);
    }
  }

  getProvider(cluster: ExternalCluster): NodeProvider {
    if (!cluster || !cluster.cloud?.kubeOne?.cloudSpec) {
      return NodeProvider.NONE;
    }

    const clusterProviders = Object.values(NodeProvider)
      .map(provider => (cluster.cloud.kubeOne.cloudSpec[provider] ? provider : undefined))
      .filter(p => p !== undefined);

    return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
  }

  reset(): void {
    this._cluster = ExternalCluster.newEmptyKubeOneClusterEntity();
  }
}
