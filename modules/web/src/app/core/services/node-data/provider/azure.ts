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
import {NodeDataService} from '@core/services/node-data/service';
import {ProjectService} from '@core/services/project';
import {AzureService} from '@core/services/provider/azure';
import {PresetsService} from '@core/services/wizard/presets';
import {Cluster} from '@shared/entity/cluster';
import {AzureSizes, AzureZones} from '@shared/entity/provider/azure';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BehaviorSubject, Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, switchMap, take, tap} from 'rxjs/operators';

export class NodeDataAzureProvider {
  private readonly _debounce = 500;
  acceleratedNetworking = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _azureService: AzureService,
    private readonly _projectService: ProjectService,
    private readonly _datacenterService: DatacenterService
  ) {}

  set tags(tags: object) {
    delete this._nodeDataService.nodeData.spec.cloud.azure.tags;
    this._nodeDataService.nodeData.spec.cloud.azure.tags = tags;
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AzureSizes[]> {
    let cluster: Cluster;
    let location = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(c => this._clusterSpecService.provider === NodeProvider.AZURE && !!c?.spec?.cloud?.dc))
          .pipe(debounceTime(this._debounce))
          .pipe(tap(c => (cluster = c)))
          .pipe(switchMap(_ => this._datacenterService.getDatacenter(cluster.spec.cloud.dc).pipe(take(1))))
          .pipe(tap(dc => (location = dc.spec.azure.location)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.AZURE)
                .clientID(cluster.spec.cloud.azure.clientID)
                .clientSecret(cluster.spec.cloud.azure.clientSecret)
                .subscriptionID(cluster.spec.cloud.azure.subscriptionID)
                .tenantID(cluster.spec.cloud.azure.tenantID)
                .location(location)
                .credential(this._presetService.preset)
                .datacenterName(cluster.spec.cloud.dc)
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
          .pipe(take(1))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._azureService.getSizes(selectedProject, this._clusterSpecService.cluster.id)))
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of([]));
            })
          );
      }
    }
  }

  zones(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<AzureZones> {
    let location = '';

    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._datacenterService
          .getDatacenter(this._clusterSpecService.cluster.spec.cloud.dc)
          .pipe(take(1))
          .pipe(
            filter(
              _ =>
                this._clusterSpecService.provider === NodeProvider.AZURE &&
                !this._clusterSpecService.cluster.spec.cloud.azure.assignAvailabilitySet
            )
          )
          .pipe(debounceTime(this._debounce))
          .pipe(tap(dc => (location = dc.spec.azure.location)))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.AZURE)
                .clientID(this._clusterSpecService.cluster.spec.cloud.azure.clientID)
                .clientSecret(this._clusterSpecService.cluster.spec.cloud.azure.clientSecret)
                .subscriptionID(this._clusterSpecService.cluster.spec.cloud.azure.subscriptionID)
                .tenantID(this._clusterSpecService.cluster.spec.cloud.azure.tenantID)
                .location(location)
                .skuName(this._nodeDataService.nodeData.spec.cloud.azure.size)
                .credential(this._presetService.preset)
                .availabilityZones(onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }

                    return onErrorResumeNext(of({} as AzureZones));
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
            switchMap(_ =>
              this._azureService.getAvailabilityZones(
                selectedProject,
                this._clusterSpecService.cluster.id,
                this._nodeDataService.nodeData.spec.cloud.azure.size
              )
            )
          )
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of({} as AzureZones));
            })
          )
          .pipe(take(1));
      }
    }
  }
}
