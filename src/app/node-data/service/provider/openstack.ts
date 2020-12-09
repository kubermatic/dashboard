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
import {OpenstackAvailabilityZone, OpenstackFlavor} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, take, switchMap, tap} from 'rxjs/operators';
import {NodeDataMode} from '../../config';
import {NodeDataService} from '../service';

export class NodeDataOpenstackProvider {
  private readonly _debounceTime = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _presetService: PresetsService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService
  ) {}

  set tags(tags: object) {
    delete this._nodeDataService.nodeData.spec.cloud.openstack.tags;
    this._nodeDataService.nodeData.spec.cloud.openstack.tags = tags;
    this._nodeDataService.nodeDataChanges.next();
  }

  flavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<OpenstackFlavor[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(debounceTime(this._debounceTime))
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.OPENSTACK))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.OPENSTACK)
                .domain(this._clusterService.cluster.spec.cloud.openstack.domain)
                .username(this._clusterService.cluster.spec.cloud.openstack.username)
                .password(this._clusterService.cluster.spec.cloud.openstack.password)
                .tenant(this._clusterService.cluster.spec.cloud.openstack.tenant)
                .tenantID(this._clusterService.cluster.spec.cloud.openstack.tenantID)
                .datacenter(this._clusterService.cluster.spec.cloud.dc)
                .credential(this._presetService.preset)
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
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(_ => this._apiService.getOpenStackFlavors(selectedProject, this._clusterService.cluster.id)))
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

  availabilityZones(
    onError: () => void = undefined,
    onLoadingCb: () => void = null
  ): Observable<OpenstackAvailabilityZone[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterService.clusterChanges
          .pipe(debounceTime(this._debounceTime))
          .pipe(filter(_ => this._clusterService.provider === NodeProvider.OPENSTACK))
          .pipe(
            switchMap(_ =>
              this._presetService
                .provider(NodeProvider.OPENSTACK)
                .domain(this._clusterService.cluster.spec.cloud.openstack.domain)
                .username(this._clusterService.cluster.spec.cloud.openstack.username)
                .password(this._clusterService.cluster.spec.cloud.openstack.password)
                .tenant(this._clusterService.cluster.spec.cloud.openstack.tenant)
                .tenantID(this._clusterService.cluster.spec.cloud.openstack.tenantID)
                .datacenter(this._clusterService.cluster.spec.cloud.dc)
                .credential(this._presetService.preset)
                .availabilityZones(onLoadingCb)
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
          .pipe(
            switchMap(_ =>
              this._apiService.getOpenStackAvailabilityZones(selectedProject, this._clusterService.cluster.id)
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
