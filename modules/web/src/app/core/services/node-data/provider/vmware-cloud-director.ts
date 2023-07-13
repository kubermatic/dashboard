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
import {VMwareCloudDirectorService} from '@core/services/provider/vmware-cloud-director';
import {PresetsService} from '@core/services/wizard/presets';
import {VMwareCloudDirector} from '@core/services/wizard/provider/vmware-cloud-director';
import {Cluster} from '@shared/entity/cluster';
import {
  VMwareCloudDirectorCatalog,
  VMwareCloudDirectorPlacementPolicy,
  VMwareCloudDirectorStorageProfile,
  VMwareCloudDirectorTemplate,
} from '@shared/entity/provider/vmware-cloud-director';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';

export class NodeDataVMwareCloudDirectorProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _projectService: ProjectService,
    private readonly _vmwareCloudDirectorService: VMwareCloudDirectorService
  ) {}

  storageProfiles(
    onError: () => void = undefined,
    onLoadingCb: () => void = null
  ): Observable<VMwareCloudDirectorStorageProfile[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
          .pipe(debounceTime(this._debounce))
          .pipe(map(() => this._clusterSpecService.cluster))
          .pipe(
            switchMap(cluster =>
              this._getProvider(cluster)
                .storageProfiles(cluster.spec.cloud.dc, onLoadingCb)
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
              this._vmwareCloudDirectorService.getStorageProfiles(project.id, this._clusterSpecService.cluster.id)
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

  catalogs(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<VMwareCloudDirectorCatalog[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
          .pipe(debounceTime(this._debounce))
          .pipe(map(() => this._clusterSpecService.cluster))
          .pipe(
            switchMap(cluster =>
              this._getProvider(cluster)
                .catalogs(cluster.spec.cloud.dc, onLoadingCb)
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
              this._vmwareCloudDirectorService.getCatalogs(project.id, this._clusterSpecService.cluster.id)
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

  templates(
    catalogName: string,
    onError: () => void = undefined,
    onLoadingCb: () => void = null
  ): Observable<VMwareCloudDirectorTemplate[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._getProvider(this._clusterSpecService.cluster)
          .templates(this._clusterSpecService.cluster.spec.cloud.dc, catalogName, onLoadingCb)
          .pipe(
            catchError(_ => {
              if (onError) {
                onError();
              }

              return onErrorResumeNext(of([]));
            })
          );
      case NodeDataMode.Dialog:
        return this._projectService.selectedProject
          .pipe(debounceTime(this._debounce))
          .pipe(tap(_ => (onLoadingCb ? onLoadingCb() : null)))
          .pipe(
            switchMap(project =>
              this._vmwareCloudDirectorService.getTemplates(
                project.id,
                this._clusterSpecService.cluster.id,
                catalogName
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

  placementPolicies(
    onError: () => void = undefined,
    onLoadingCb: () => void = null
  ): Observable<VMwareCloudDirectorPlacementPolicy[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
          .pipe(debounceTime(this._debounce))
          .pipe(map(() => this._clusterSpecService.cluster))
          .pipe(
            switchMap(cluster =>
              this._getProvider(cluster)
                .placementpolicies(cluster.spec.cloud.dc, onLoadingCb)
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
              this._vmwareCloudDirectorService.getPlacementPolicies(project.id, this._clusterSpecService.cluster.id)
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

  private _getProvider(cluster: Cluster): VMwareCloudDirector {
    return this._presetService
      .provider(NodeProvider.VMWARECLOUDDIRECTOR)
      .username(cluster.spec.cloud.vmwareclouddirector.username)
      .password(cluster.spec.cloud.vmwareclouddirector.password)
      .apiToken(cluster.spec.cloud.vmwareclouddirector.apiToken)
      .organization(cluster.spec.cloud.vmwareclouddirector.organization)
      .vdc(cluster.spec.cloud.vmwareclouddirector.vdc)
      .credential(this._presetService.preset);
  }
}
