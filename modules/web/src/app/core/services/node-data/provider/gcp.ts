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
import {ProjectService} from '@core/services/project';
import {GCPService} from '@core/services/provider/gcp';
import {PresetsService} from '@core/services/wizard/presets';
import {Cluster} from '@shared/entity/cluster';
import {GCPDiskType, GCPMachineSize, GCPZone} from '@shared/entity/provider/gcp';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import _ from 'lodash';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';

export class NodeDataGCPProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _gcpService: GCPService,
    private readonly _projectService: ProjectService
  ) {}

  set labels(labels: object) {
    delete this._nodeDataService.nodeData.spec.cloud.gcp.labels;
    this._nodeDataService.nodeData.spec.cloud.gcp.labels = _.isEmpty(labels) ? null : labels;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  set tags(tags: string[]) {
    delete this._nodeDataService.nodeData.spec.cloud.gcp.tags;
    this._nodeDataService.nodeData.spec.cloud.gcp.tags = tags;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  zones(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<GCPZone[]> {
    let cluster: Cluster;

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.GCP))
          .pipe(debounceTime(this._debounce))
          .pipe(tap(c => (cluster = c)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.GCP)
                .serviceAccount(cluster.spec.cloud.gcp.serviceAccount)
                .credential(this._presetService.preset)
                .zones(this._clusterSpecService.datacenter, onLoadingCb)
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
          .pipe(switchMap(_ => this._gcpService.getZones(selectedProject, this._clusterSpecService.cluster.id)))
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
          .serviceAccount(this._clusterSpecService.cluster.spec.cloud.gcp.serviceAccount)
          .zone(this._nodeDataService.nodeData.spec.cloud.gcp.zone)
          .credential(this._presetService.preset)
          .datacenterName(this._clusterSpecService.cluster.spec.cloud.dc)
          .diskTypes(onLoadingCb)
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of([]));
            })
          )
          .pipe(debounceTime(this._debounce));
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(_ =>
              this._gcpService.getDiskTypes(
                this._nodeDataService.nodeData.spec.cloud.gcp.zone,
                selectedProject,
                this._clusterSpecService.cluster.id
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
          .serviceAccount(this._clusterSpecService.cluster.spec.cloud.gcp.serviceAccount)
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
          )
          .pipe(debounceTime(this._debounce));
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(_ =>
              this._gcpService.getSizes(
                this._nodeDataService.nodeData.spec.cloud.gcp.zone,
                selectedProject,
                this._clusterSpecService.cluster.id
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
