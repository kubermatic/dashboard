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
import {DatacenterService, PresetsService} from '../../../core/services';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterService} from '../../../wizard-new/service/cluster';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';
import {AWSSize, AWSSubnet} from '../../../shared/entity/provider/aws';

export class NodeDataAWSProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService
  ) {}

  set tags(tags: object) {
    delete this._nodeDataService.nodeData.spec.cloud.aws.tags;
    this._nodeDataService.nodeData.spec.cloud.aws.tags = tags;
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AWSSize[]> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.datacenterChanges
          .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc)))
          .pipe(
            switchMap(dc =>
              this._presetService
                .provider(NodeProvider.AWS)
                .region(dc.spec.aws.region)
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

  subnets(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AWSSubnet[]> {
    // TODO: support dialog mode
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.AWS))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.AWS)
                .accessKeyID(cluster.spec.cloud.aws.accessKeyId)
                .secretAccessKey(cluster.spec.cloud.aws.secretAccessKey)
                .vpc(cluster.spec.cloud.aws.vpcId)
                .credential(this._presetService.preset)
                .subnets(cluster.spec.cloud.dc, onLoadingCb)
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
