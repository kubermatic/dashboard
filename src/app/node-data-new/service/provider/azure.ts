// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, switchMap, tap} from 'rxjs/operators';
import {DatacenterService, PresetsService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../wizard-new/service/cluster';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';
import {AzureSizes, AzureZones} from '../../../shared/entity/provider/azure';

export class NodeDataAzureProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService
  ) {}

  set tags(tags: object) {
    delete this._nodeDataService.nodeData.spec.cloud.azure.tags;
    this._nodeDataService.nodeData.spec.cloud.azure.tags = tags;
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AzureSizes[]> {
    let cluster: Cluster;
    let location = '';

    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
          .pipe(tap(c => (cluster = c)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(cluster.spec.cloud.dc)))
          .pipe(tap(dc => (location = dc.spec.azure.location)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.AZURE)
                .clientID(cluster.spec.cloud.azure.clientID)
                .clientSecret(cluster.spec.cloud.azure.clientSecret)
                .subscriptionID(cluster.spec.cloud.azure.subscriptionID)
                .tenantID(cluster.spec.cloud.azure.tenantID)
                .location(location)
                .credential(this._presetService.preset)
                .flavors(onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }

                    return onErrorResumeNext(of([]));
                  })
                )
            )
          );
    }
  }

  zones(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AzureZones> {
    let location = '';

    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._datacenterService
          .getDatacenter(this._clusterService.cluster.spec.cloud.dc)
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.AZURE))
          .pipe(tap(dc => (location = dc.spec.azure.location)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.AZURE)
                .clientID(this._clusterService.cluster.spec.cloud.azure.clientID)
                .clientSecret(this._clusterService.cluster.spec.cloud.azure.clientSecret)
                .subscriptionID(this._clusterService.cluster.spec.cloud.azure.subscriptionID)
                .tenantID(this._clusterService.cluster.spec.cloud.azure.tenantID)
                .location(location)
                .skuName(this._nodeDataService.nodeData.spec.cloud.azure.size)
                .credential(this._presetService.preset)
                .availabilityZones(onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }

                    return onErrorResumeNext(of());
                  })
                )
            )
          );
    }
  }
}
