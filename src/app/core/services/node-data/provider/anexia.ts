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
import {ApiService} from '@core/services/api';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {Cluster} from '@shared/entity/cluster';
import {AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, take, switchMap, tap, debounceTime} from 'rxjs/operators';
import {NodeDataService} from '../service';

export class NodeDataAnexiaProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService
  ) {}

  vlans(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AnexiaVlan[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.ANEXIA))
          .pipe(debounceTime(this._debounce))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.ANEXIA)
                .token(cluster.spec.cloud.anexia.token)
                .credential(this._presetService.preset)
                .vlans(onLoadingCb)
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
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._apiService.getAnexiaVlans(selectedProject, this._clusterSpecService.cluster.id)))
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

  templates(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AnexiaTemplate[]> {
    let cluster: Cluster;
    let location = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.ANEXIA))
          .pipe(debounceTime(this._debounce))
          .pipe(tap(c => (cluster = c)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(cluster.spec.cloud.dc).pipe(take(1))))
          .pipe(tap(dc => (location = dc?.spec.anexia.location_id)))
          .pipe(filter(_ => location?.length > 0))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.ANEXIA)
                .token(cluster.spec.cloud.anexia.token)
                .location(location)
                .credential(this._presetService.preset)
                .templates(onLoadingCb)
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
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.cluster.spec.cloud.dc)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._apiService.getAnexiaTemplates(
                selectedProject,
                this._clusterSpecService.cluster.id,
                dc.spec.anexia.location_id
              )
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
          .pipe(take(1));
      }
    }
  }
}
