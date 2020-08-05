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
import {catchError, filter, first, switchMap, tap} from 'rxjs/operators';

import {ApiService, DatacenterService, PresetsService, ProjectService} from '../../../core/services';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../shared/services/cluster.service';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';
import {PacketSize} from '../../../shared/entity/provider/packet';

export class NodeDataPacketProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _datacenterService: DatacenterService
  ) {}

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.packet.tags;
    this._nodeDataService.nodeData.spec.cloud.packet.tags = tags;
    this._nodeDataService.nodeDataChanges.next();
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<PacketSize[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.PACKET))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.PACKET)
                .apiKey(cluster.spec.cloud.packet.apiKey)
                .projectID(cluster.spec.cloud.packet.projectID)
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
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(
            switchMap(_ =>
              this._datacenterService.getDatacenter(this._clusterService.cluster.spec.cloud.dc).pipe(first())
            )
          )
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._apiService.getPacketSizes(selectedProject, dc.spec.seed, this._clusterService.cluster.id)
            )
          )
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of([]));
            })
          )
          .pipe(first());
      }
    }
  }
}
