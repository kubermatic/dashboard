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
import {PresetsService} from '@core/services/wizard/presets';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, switchMap, take, tap} from 'rxjs/operators';
import {NodeDataService} from '../service';
import {KubeVirtStorageClass, KubeVirtVMInstancePreset} from '@shared/entity/provider/kubevirt';
import {KubeVirtService} from '@core/services/provider/kubevirt';

export class NodeDataKubeVirtProvider {
  private readonly _debounce = 500;

  constructor(
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetService: PresetsService,
    private readonly _kubeVirtService: KubeVirtService,
    private readonly _projectService: ProjectService
  ) {}

  vmFlavors(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<KubeVirtVMInstancePreset[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.KUBEVIRT))
          .pipe(debounceTime(this._debounce))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.KUBEVIRT)
                .kubeconfig(cluster.spec.cloud.kubevirt.kubeconfig)
                .credential(this._presetService.preset)
                .vmFlavors(onLoadingCb)
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
          .pipe(
            switchMap(_ => this._kubeVirtService.getVMFlavors(selectedProject, this._clusterSpecService.cluster.id))
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

  storageClasses(onError: () => void = undefined, onLoadingCb: () => void = null): Observable<KubeVirtStorageClass[]> {
    switch (this._nodeDataService.mode) {
      case NodeDataMode.Wizard:
        return this._clusterSpecService.clusterChanges
          .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.KUBEVIRT))
          .pipe(debounceTime(this._debounce))
          .pipe(
            switchMap(cluster =>
              this._presetService
                .provider(NodeProvider.KUBEVIRT)
                .kubeconfig(cluster.spec.cloud.kubevirt.kubeconfig)
                .credential(this._presetService.preset)
                .storageClass(onLoadingCb)
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
          .pipe(
            switchMap(_ =>
              this._kubeVirtService.getStorageClasses(selectedProject, this._clusterSpecService.cluster.id)
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
