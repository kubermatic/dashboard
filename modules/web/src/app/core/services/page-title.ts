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

import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {ClusterService} from '@core/services/cluster';
import {ParamsService, PathParam} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {Cluster} from '@shared/entity/cluster';
import {getViewDisplayName, View, ViewDisplayName} from '@shared/entity/common';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {iif, Observable, of} from 'rxjs';
import {switchMap, take, tap} from 'rxjs/operators';
import {Auth} from './auth/service';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {MachineDeploymentService} from '@core/services/machine-deployment';

@Injectable()
export class PageTitleService {
  projectName: string;
  clusterName: string;
  mdName: string;

  constructor(
    private readonly _titleService: Title,
    private readonly _params: ParamsService,
    private readonly _projectService: ProjectService,
    private readonly _clusterService: ClusterService,
    private readonly _machineDeploymentService: MachineDeploymentService,
    private readonly _auth: Auth
  ) {}

  setTitle(url: string, postfix?: string): void {
    const viewName = this._getViewName(url.split('/').reverse());
    this._titleService.setTitle(postfix ? `${viewName} | ${postfix}` : viewName);

    if (!this._auth.authenticated()) {
      return;
    }

    this._projectService.selectedProject
      .pipe(tap(project => (this.projectName = project ? project.name : '')))
      .pipe(switchMap(_ => this._clusterObservable()))
      .pipe(tap(cluster => (this.clusterName = cluster ? cluster.name : '')))
      .pipe(switchMap(_ => this._machineDeploymentObservable()))
      .pipe(tap(md => (this.mdName = md ? md.name : '')))
      .pipe(take(1))
      .subscribe(_ => {
        this._titleService.setTitle(
          postfix ? `${this._generateTitle(viewName)} | ${postfix}` : this._generateTitle(viewName)
        );
      });
  }

  private _getViewName(urlArray: string[]): string {
    const filteredUrlArray = urlArray.filter(url => !!url);
    if (!filteredUrlArray.length) {
      return getViewDisplayName(View.SignIn);
    }
    const viewName = filteredUrlArray.find(partial => Object.values(View).find(view => view === partial));
    return viewName ? getViewDisplayName(viewName) : '';
  }

  private _generateTitle(viewName: string): string {
    // titleString should at least display the viewName
    let titleString: string = viewName;
    const project = this._params.get(PathParam.ProjectID)
      ? `${ViewDisplayName.Projects.slice(0, -1)} '${this.projectName}'`
      : '';
    const cluster = this._params.get(PathParam.ClusterID)
      ? `${ViewDisplayName.Clusters.slice(0, -1)} '${this.clusterName}' in `
      : '';
    const md = this._params.get(PathParam.MachineDeploymentID)
      ? `${ViewDisplayName.MachineDeployment} '${this.mdName}' in `
      : '';

    // if project isn't empty, project string should be added to viewName
    if (project) {
      titleString += ` in ${project}`;
    }

    // as machine deployments could not work without a cluster:
    // if cluster isn't empty, remove viewName from title and display machine deployment, cluster and project string
    if (cluster) {
      titleString = md + cluster + project;
    }

    return titleString;
  }

  private _clusterObservable(): Observable<Cluster> | Observable<ExternalCluster> {
    const projectId = this._params.get(PathParam.ProjectID);
    const clusterId = this._params.get(PathParam.ClusterID);
    const isExternal = this._params.getCurrentUrl().includes(`/${View.ExternalClusters}/`);
    const isKubeOne = this._params.getCurrentUrl().includes(`/${View.KubeOneClusters}/`);

    if (projectId && clusterId) {
      if (isExternal || isKubeOne) {
        return this._clusterService.externalCluster(projectId, clusterId);
      }
      return this._clusterService.cluster(projectId, clusterId);
    }
    return of(null);
  }

  private _machineDeploymentObservable(): Observable<MachineDeployment> {
    const projectId = this._params.get(PathParam.ProjectID);
    const clusterId = this._params.get(PathParam.ClusterID);
    const machineDeploymentId = this._params.get(PathParam.MachineDeploymentID);
    const isExternal = this._params.getCurrentUrl().includes(`/${View.ExternalClusters}/`);
    const isKubeOne = this._params.getCurrentUrl().includes(`/${View.KubeOneClusters}/`);

    if (!projectId || !clusterId || !machineDeploymentId) {
      return of(null);
    }

    return iif(
      () => isExternal || isKubeOne,
      this._clusterService.externalMachineDeployment(projectId, clusterId, machineDeploymentId),
      this._machineDeploymentService.get(machineDeploymentId, clusterId, projectId)
    );
  }
}
