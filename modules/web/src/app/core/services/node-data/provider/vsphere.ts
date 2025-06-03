// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {VSphereService} from '@core/services/provider/vsphere';
import {PresetsService} from '@core/services/wizard/presets';
import {VSphereTag} from '@shared/entity/node';
import {VSphereTagCategory, VSphereVMGroup} from '@shared/entity/provider/vsphere';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext, startWith} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';

export class NodeDataVSphereProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _projectService: ProjectService,
    private readonly _vsphereService: VSphereService
  ) {}

  set tags(tags: VSphereTag[]) {
    delete this._nodeDataService.nodeData.spec.cloud.vsphere.tags;
    this._nodeDataService.nodeData.spec.cloud.vsphere.tags = tags;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  categories(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<VSphereTagCategory[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VSPHERE))
          .pipe(debounceTime(this._debounce))
          .pipe(map(() => this._clusterSpecService.cluster))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.VSPHERE)
                .username(
                  cluster.spec.cloud.vsphere.infraManagementUser?.username || cluster.spec.cloud.vsphere.username
                )
                .password(
                  cluster.spec.cloud.vsphere.infraManagementUser?.password || cluster.spec.cloud.vsphere.password
                )
                .credential(this._presetService.preset)
                .datacenter(this._clusterSpecService.datacenter)
                .tagCategories(onLoadingCb)
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
      case NodeDataMode.Dialog:
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(project => this._vsphereService.getTagCategories(project.id, this._clusterSpecService.cluster.id))
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

  categoryTags(
    category: string,
    onError: () => void = undefined,
    onLoadingCb: () => void = null
  ): Observable<VSphereTag[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(startWith(true))
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VSPHERE))
          .pipe(debounceTime(this._debounce))
          .pipe(map(() => this._clusterSpecService.cluster))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.VSPHERE)
                .username(
                  cluster.spec.cloud.vsphere.infraManagementUser?.username || cluster.spec.cloud.vsphere.username
                )
                .password(
                  cluster.spec.cloud.vsphere.infraManagementUser?.password || cluster.spec.cloud.vsphere.password
                )
                .credential(this._presetService.preset)
                .datacenter(this._clusterSpecService.datacenter)
                .tags(category, onLoadingCb)
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
      case NodeDataMode.Dialog:
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(project =>
              this._vsphereService.getTags(project.id, this._clusterSpecService.cluster.id, category)
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

  vmGroups(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<VSphereVMGroup[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VSPHERE))
          .pipe(debounceTime(this._debounce))
          .pipe(map(() => this._clusterSpecService.cluster))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.VSPHERE)
                .username(
                  cluster.spec.cloud.vsphere.infraManagementUser?.username || cluster.spec.cloud.vsphere.username
                )
                .password(
                  cluster.spec.cloud.vsphere.infraManagementUser?.password || cluster.spec.cloud.vsphere.password
                )
                .credential(this._presetService.preset)
                .datacenter(this._clusterSpecService.datacenter)
                .vmGroups(onLoadingCb)
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
      case NodeDataMode.Dialog:
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(switchMap(project => this._vsphereService.getVMGroups(project.id, this._clusterSpecService.cluster.id)))
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
