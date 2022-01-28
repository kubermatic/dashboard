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
import {DatacenterService} from '@core/services/datacenter';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {AWSSize, AWSSubnet} from '@shared/entity/provider/aws';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';
import {AWSService} from '@core/services/provider/aws';

export class NodeDataAWSProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterDataService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _awsService: AWSService,
    private readonly _projectService: ProjectService,
    private readonly _datacenterService: DatacenterService
  ) {}

  set tags(tags: object) {
    delete this._nodeDataService.nodeData.spec.cloud.aws.tags;
    this._nodeDataService.nodeData.spec.cloud.aws.tags = tags;
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AWSSize[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterDataService.datacenterChanges
          .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
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
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._awsService.getSizes(selectedProject, this._clusterDataService.cluster.id)))
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

  subnets(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AWSSubnet[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterDataService.clusterChanges
          .pipe(filter(_ => this._clusterDataService.provider === NodeProvider.AWS))
          .pipe(debounceTime(this._debounce))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.AWS)
                .accessKeyID(cluster.spec.cloud.aws.accessKeyId)
                .secretAccessKey(cluster.spec.cloud.aws.secretAccessKey)
                .assumeRoleARN(cluster.spec.cloud.aws.assumeRoleARN)
                .assumeRoleExternalID(cluster.spec.cloud.aws.assumeRoleExternalID)
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
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._awsService.getSubnets(selectedProject, this._clusterDataService.cluster.id)))
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
