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

import {ApiService} from '@core/services/api/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {ProjectService} from '@core/services/project/service';
import {PresetsService} from '@core/services/wizard/presets.service';
import {Cluster} from '@shared/entity/cluster';
import {AlibabaInstanceType, AlibabaZone, AlibabaVSwitch} from '@shared/entity/provider/alibaba';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, take, switchMap, tap} from 'rxjs/operators';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataAlibabaProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService
  ) {}

  set labels(labels: object) {
    delete this._nodeDataService.nodeData.spec.cloud.alibaba.labels;
    this._nodeDataService.nodeData.spec.cloud.alibaba.labels = labels;
    this._nodeDataService.nodeDataChanges.next();
  }

  instanceTypes(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AlibabaInstanceType[]> {
    let cluster: Cluster;
    let region = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.ALIBABA))
          .pipe(tap(c => (cluster = c)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(cluster.spec.cloud.dc).pipe(take(1))))
          .pipe(tap(dc => (region = dc.spec.alibaba.region)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.ALIBABA)
                .accessKeyID(cluster.spec.cloud.alibaba.accessKeyID)
                .accessKeySecret(cluster.spec.cloud.alibaba.accessKeySecret)
                .region(region)
                .credential(this._presetService.preset)
                .instanceTypes(onLoadingCb)
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
              this._datacenterService.getDatacenter(this._clusterService.cluster.spec.cloud.dc).pipe(take(1))
            )
          )
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._apiService.getAlibabaInstanceTypes(
                selectedProject,
                this._clusterService.cluster.id,
                dc.spec.alibaba.region
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

  zones(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AlibabaZone[]> {
    let cluster: Cluster;
    let region = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.ALIBABA))
          .pipe(tap(c => (cluster = c)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(cluster.spec.cloud.dc).pipe(take(1))))
          .pipe(tap(dc => (region = dc.spec.alibaba.region)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.ALIBABA)
                .accessKeyID(cluster.spec.cloud.alibaba.accessKeyID)
                .accessKeySecret(cluster.spec.cloud.alibaba.accessKeySecret)
                .region(region)
                .credential(this._presetService.preset)
                .zones(onLoadingCb)
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
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterService.cluster.spec.cloud.dc)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._apiService.getAlibabaZones(selectedProject, this._clusterService.cluster.id, dc.spec.alibaba.region)
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

  vSwitches(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AlibabaVSwitch[]> {
    let cluster: Cluster;
    let region = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.ALIBABA))
          .pipe(tap(c => (cluster = c)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(cluster.spec.cloud.dc).pipe(take(1))))
          .pipe(tap(dc => (region = dc.spec.alibaba.region)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.ALIBABA)
                .accessKeyID(cluster.spec.cloud.alibaba.accessKeyID)
                .accessKeySecret(cluster.spec.cloud.alibaba.accessKeySecret)
                .region(region)
                .credential(this._presetService.preset)
                .vSwitches(onLoadingCb)
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
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterService.cluster.spec.cloud.dc)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._apiService.getAlibabaVSwitches(
                selectedProject,
                this._clusterService.cluster.id,
                dc.spec.alibaba.region
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
