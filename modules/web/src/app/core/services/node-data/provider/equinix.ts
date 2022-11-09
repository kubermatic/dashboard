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

import {NodeDataMode} from '@app/node-data/config';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {EquinixSize} from '@shared/entity/provider/equinix';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';
import {EquinixService} from '@core/services/provider/equinix';

export class NodeDataEquinixProvider {
  private readonly _debounceTime = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _equinixService: EquinixService,
    private readonly _projectService: ProjectService
  ) {}

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.packet.tags;
    this._nodeDataService.nodeData.spec.cloud.packet.tags = tags;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<EquinixSize[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.EQUINIX))
          .pipe(debounceTime(this._debounceTime))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.EQUINIX)
                .apiKey(cluster.spec.cloud.packet.apiKey)
                .projectID(cluster.spec.cloud.packet.projectID)
                .credential(this._presetService.preset)
                .datacenterName(cluster.spec.cloud.dc)
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
          .pipe(debounceTime(this._debounceTime))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._equinixService.getSizes(selectedProject, this._clusterSpecService.cluster.id)))
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of([]));
            })
          )
          .pipe(take(1));
      }
    }
  }
}
