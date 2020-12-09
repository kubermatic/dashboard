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
import {ProjectService} from '@core/services/project/service';
import {PresetsService} from '@core/services/wizard/presets.service';
import {Cluster} from '@shared/entity/cluster';
import {GCPDiskType, GCPMachineSize, GCPZone} from '@shared/entity/provider/gcp';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, filter, take, switchMap, tap} from 'rxjs/operators';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataGCPProvider {
  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService
  ) {}

  set labels(labels: object) {
    delete this._nodeDataService.nodeData.spec.cloud.gcp.labels;
    this._nodeDataService.nodeData.spec.cloud.gcp.labels = labels;
    this._nodeDataService.nodeDataChanges.next();
  }

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.gcp.tags;
    this._nodeDataService.nodeData.spec.cloud.gcp.tags = tags;
    this._nodeDataService.nodeDataChanges.next();
  }

  zones(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<GCPZone[]> {
    let cluster: Cluster;

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.GCP))
          .pipe(tap(c => (cluster = c)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.GCP)
                .serviceAccount(cluster.spec.cloud.gcp.serviceAccount)
                .credential(this._presetService.preset)
                .zones(this._clusterService.datacenter, onLoadingCb)
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
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._apiService.getGCPZones(selectedProject, this._clusterService.cluster.id)))
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

  diskTypes(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<GCPDiskType[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._presetService
          .provider(NodeProvider.GCP)
          .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
          .zone(this._nodeDataService.nodeData.spec.cloud.gcp.zone)
          .credential(this._presetService.preset)
          .diskTypes(onLoadingCb)
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of([]));
            })
          );
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(_ =>
              this._apiService.getGCPDiskTypes(
                this._nodeDataService.nodeData.spec.cloud.gcp.zone,
                selectedProject,
                this._clusterService.cluster.id
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

  machineTypes(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<GCPMachineSize[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._presetService
          .provider(NodeProvider.GCP)
          .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
          .zone(this._nodeDataService.nodeData.spec.cloud.gcp.zone)
          .credential(this._presetService.preset)
          .machineTypes(onLoadingCb)
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of([]));
            })
          );
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(_ =>
              this._apiService.getGCPSizes(
                this._nodeDataService.nodeData.spec.cloud.gcp.zone,
                selectedProject,
                this._clusterService.cluster.id
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
