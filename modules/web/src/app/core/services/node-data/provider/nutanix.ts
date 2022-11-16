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
import {NutanixService} from '@core/services/provider/nutanix';
import {PresetsService} from '@core/services/wizard/presets';
import {NutanixCategory, NutanixCategoryValue, NutanixSubnet} from '@shared/entity/provider/nutanix';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {merge, Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, map, startWith, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';

export class NodeDataNutanixProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _nutanixService: NutanixService,
    private readonly _projectService: ProjectService
  ) {}

  subnets(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<NutanixSubnet[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return merge(this._clusterSpecService.clusterChanges, this._clusterSpecService.providerSpecChanges)
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
          .pipe(debounceTime(this._debounce))
          .pipe(map(() => this._clusterSpecService.cluster))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.NUTANIX)
                .username(cluster.spec.cloud.nutanix.username)
                .password(cluster.spec.cloud.nutanix.password)
                .proxyURL(cluster.spec.cloud.nutanix.proxyURL)
                .clusterName(cluster.spec.cloud.nutanix.clusterName)
                .projectName(cluster.spec.cloud.nutanix.projectName)
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
          .pipe(switchMap(_ => this._nutanixService.getSubnets(selectedProject, this._clusterSpecService.cluster.id)))
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

  categories(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<NutanixCategory[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return merge(this._clusterSpecService.clusterChanges, this._clusterSpecService.providerSpecChanges)
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
          .pipe(debounceTime(this._debounce))
          .pipe(switchMap(() => this._projectService.selectedProject.pipe(take(1))))
          .pipe(
            switchMap(project => {
              const cluster = this._clusterSpecService.cluster;
              return this._presetService
                .provider(NodeProvider.NUTANIX)
                .username(cluster.spec.cloud.nutanix.username)
                .password(cluster.spec.cloud.nutanix.password)
                .proxyURL(cluster.spec.cloud.nutanix.proxyURL)
                .credential(this._presetService.preset)
                .categories(cluster.spec.cloud.dc, project.id, onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }
                    return onErrorResumeNext(of([]));
                  })
                );
            })
          );
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(_ => this._nutanixService.getCategories(selectedProject, this._clusterSpecService.cluster.id))
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

  categoryValues(
    categoryName: string,
    onError: () => void = undefined,
    onLoadingCb: () => void = null
  ): Observable<NutanixCategoryValue[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return merge(this._clusterSpecService.clusterChanges, this._clusterSpecService.providerSpecChanges)
          .pipe(startWith(true))
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
          .pipe(debounceTime(this._debounce))
          .pipe(switchMap(() => this._projectService.selectedProject.pipe(take(1))))
          .pipe(
            switchMap(project => {
              const cluster = this._clusterSpecService.cluster;
              return this._presetService
                .provider(NodeProvider.NUTANIX)
                .username(cluster.spec.cloud.nutanix.username)
                .password(cluster.spec.cloud.nutanix.password)
                .proxyURL(cluster.spec.cloud.nutanix.proxyURL)
                .credential(this._presetService.preset)
                .categoryValues(cluster.spec.cloud.dc, project.id, categoryName, onLoadingCb)
                .pipe(
                  catchError(_ => {
                    if (onError) {
                      onError();
                    }
                    return onErrorResumeNext(of([]));
                  })
                );
            })
          );
      case NodeDataMode.Dialog: {
        let selectedProject: string;
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(project => (selectedProject = project.id)))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(_ =>
              this._nutanixService.getCategoryValues(selectedProject, this._clusterSpecService.cluster.id, categoryName)
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
