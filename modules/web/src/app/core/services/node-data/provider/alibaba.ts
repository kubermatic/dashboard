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
import {Cluster} from '@shared/entity/cluster';
import {AlibabaInstanceType, AlibabaVSwitch, AlibabaZone} from '@shared/entity/provider/alibaba';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';
import {AlibabaService} from '@core/services/provider/alibaba';

export class NodeDataAlibabaProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _alibabaService: AlibabaService,
    private readonly _projectService: ProjectService
  ) {}

  set labels(labels: object) {
    delete this._nodeDataService.nodeData.spec.cloud.alibaba.labels;
    this._nodeDataService.nodeData.spec.cloud.alibaba.labels = labels;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  instanceTypes(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AlibabaInstanceType[]> {
    let cluster: Cluster;
    let region = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(c => this._clusterSpecService.provider === NodeProvider.ALIBABA && !!c?.spec?.cloud?.dc))
          .pipe(debounceTime(this._debounce))
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
                .datacenterName(cluster.spec.cloud.dc)
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
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(
            switchMap(_ =>
              this._datacenterService.getDatacenter(this._clusterSpecService.cluster.spec.cloud.dc).pipe(take(1))
            )
          )
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._alibabaService.getInstanceTypes(
                selectedProject,
                this._clusterSpecService.cluster.id,
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
        return this._clusterSpecService.clusterChanges
          .pipe(filter(c => this._clusterSpecService.provider === NodeProvider.ALIBABA && !!c?.spec?.cloud?.dc))
          .pipe(debounceTime(this._debounce))
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
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.cluster.spec.cloud.dc)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._alibabaService.getZones(
                selectedProject,
                this._clusterSpecService.cluster.id,
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

  vSwitches(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AlibabaVSwitch[]> {
    let cluster: Cluster;
    let region = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(c => this._clusterSpecService.provider === NodeProvider.ALIBABA && !!c?.spec?.cloud?.dc))
          .pipe(debounceTime(this._debounce))
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
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.cluster.spec.cloud.dc)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(dc =>
              this._alibabaService.getVSwitches(
                selectedProject,
                this._clusterSpecService.cluster.id,
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
