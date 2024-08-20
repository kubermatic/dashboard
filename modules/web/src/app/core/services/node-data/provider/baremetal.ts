// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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
import {NodeDataService} from '@core/services/node-data/service';
import {ProjectService} from '@core/services/project';
import {BaremetalService} from '@core/services/provider/baremetal';
import {TinkerbellOSImageList} from '@shared/entity/provider/baremetal';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, switchMap, take, tap} from 'rxjs/operators';

export class NodeDataBaremetalProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _baremetalService: BaremetalService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _projectService: ProjectService
  ) {}

  osImages(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<TinkerbellOSImageList> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.datacenterChanges
          .pipe(debounceTime(this._debounce))
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.BAREMETAL))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(datacenter => this._baremetalService.getOSImages(datacenter)))
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of({} as TinkerbellOSImageList));
            })
          );
      case NodeDataMode.Dialog: {
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._baremetalService.getOSImages(this._clusterSpecService.datacenter)))
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of({} as TinkerbellOSImageList));
            })
          )
          .pipe(take(1));
      }
    }
  }
}
