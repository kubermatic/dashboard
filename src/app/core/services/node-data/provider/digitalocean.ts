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
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {DigitaloceanSizes} from '@shared/entity/provider/digitalocean';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, take, switchMap, tap, debounceTime} from 'rxjs/operators';
import {NodeDataService} from '../service';

export class NodeDataDigitalOceanProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService
  ) {}

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.digitalocean.tags;
    this._nodeDataService.nodeData.spec.cloud.digitalocean.tags = tags;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<DigitaloceanSizes> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.DIGITALOCEAN))
          .pipe(debounceTime(this._debounce))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.DIGITALOCEAN)
                .token(cluster.spec.cloud.digitalocean.token)
                .credential(this._presetService.preset)
                .flavors(onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }

                    return onErrorResumeNext(of(DigitaloceanSizes.newDigitalOceanSizes()));
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
          .pipe(
            switchMap(_ => this._apiService.getDigitaloceanSizes(selectedProject, this._clusterSpecService.cluster.id))
          )
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of(DigitaloceanSizes.newDigitalOceanSizes()));
            })
          )
          .pipe(take(1));
      }
    }
  }
}
