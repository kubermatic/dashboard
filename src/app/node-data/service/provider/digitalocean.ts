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

import {ApiService} from '@core/services/api/api.service';
import {DatacenterService} from '@core/services/datacenter/datacenter.service';
import {ProjectService} from '@core/services/project/project.service';
import {PresetsService} from '@core/services/wizard/presets.service';
import {DigitaloceanSizes} from '@shared/entity/provider/digitalocean';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, first, switchMap, tap} from 'rxjs/operators';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataDigitalOceanProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _datacenterService: DatacenterService
  ) {}

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.digitalocean.tags;
    this._nodeDataService.nodeData.spec.cloud.digitalocean.tags = tags;
    this._nodeDataService.nodeDataChanges.next();
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<DigitaloceanSizes> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.DIGITALOCEAN))
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
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(
            switchMap(_ =>
              this._datacenterService.getDatacenter(this._clusterService.cluster.spec.cloud.dc).pipe(first())
            )
          )
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._apiService.getDigitaloceanSizes(selectedProject, dc.spec.seed, this._clusterService.cluster.id)
            )
          )
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of(DigitaloceanSizes.newDigitalOceanSizes()));
            })
          )
          .pipe(first());
      }
    }
  }
}
