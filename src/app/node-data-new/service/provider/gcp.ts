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

import {merge, Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, switchMap, tap} from 'rxjs/operators';

import {PresetsService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../shared/services/cluster.service';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';
import {GCPDiskType, GCPMachineSize, GCPZone} from '../../../shared/entity/provider/gcp';

export class NodeDataGCPProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService
  ) {}

  set labels(labels: object) {
    delete this._nodeDataService.nodeData.spec.cloud.gcp.labels;
    this._nodeDataService.nodeData.spec.cloud.gcp.labels = labels;
    this._nodeDataService.nodeDataChanges.next();
  }

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.gcp.tags;
    this._nodeDataService.nodeData.spec.cloud.gcp.tags = tags;
    this._nodeDataService.nodeDataChanges.next();
  }

  zones(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<GCPZone[]> {
    let cluster: Cluster;

    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.GCP))
          .pipe(tap(c => (cluster = c)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.GCP)
                .serviceAccount(cluster.spec.cloud.gcp.serviceAccount)
                .credential(this._presetService.preset)
                .zones(this._clusterService.datacenter, onLoadingCb)
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

  diskTypes(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<GCPDiskType[]> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return merge(this._clusterService.clusterChanges, this._nodeDataService.nodeDataChanges)
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.GCP))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.GCP)
                .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
                .zone(this._nodeDataService.nodeData.spec.cloud.gcp.zone)
                .credential(this._presetService.preset)
                .diskTypes(onLoadingCb)
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

  machineTypes(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<GCPMachineSize[]> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return merge(this._clusterService.clusterChanges, this._nodeDataService.nodeDataChanges)
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.GCP))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.GCP)
                .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
                .zone(this._nodeDataService.nodeData.spec.cloud.gcp.zone)
                .credential(this._presetService.preset)
                .machineTypes(onLoadingCb)
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
}
