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
import {catchError, filter, switchMap} from 'rxjs/operators';

import {PresetsService} from '../../../core/services';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../shared/services/cluster.service';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';
import {HetznerTypes} from '../../../shared/entity/provider/hetzner';

export class NodeDataHetznerProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService
  ) {}

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<HetznerTypes> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.HETZNER))
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
    }
  }
}
