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

import {NodeDataMode} from '@app/node-data/config';
import {ApiService} from '@core/services/api';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {HetznerTypes} from '@shared/entity/provider/hetzner';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, take, switchMap, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';

export class NodeDataHetznerProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService
  ) {}

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<HetznerTypes> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.HETZNER))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.HETZNER)
                .token(cluster.spec.cloud.hetzner.token)
                .credential(this._presetService.preset)
                .flavors(onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }

                    return onErrorResumeNext(of(HetznerTypes.newHetznerTypes()));
                  })
                )
            )
          );
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._apiService.getHetznerTypes(selectedProject, this._clusterSpecService.cluster.id)))
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of(HetznerTypes.newHetznerTypes()));
            })
          )
          .pipe(take(1));
      }
    }
  }
}
