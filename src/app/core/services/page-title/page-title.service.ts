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

import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Subject, of, Observable} from 'rxjs';
import {takeUntil, switchMap, tap} from 'rxjs/operators';

import {ProjectService, ClusterService, ApiService} from '../../services';
import {ParamsService, PathParam} from '../../services/params/params.service';
import {Cluster} from '../../../shared/entity/cluster';
import {View, getViewDisplayName, ViewDisplayName} from '../../../shared/entity/common';
import {MachineDeployment} from '../../../shared/entity/machine-deployment';

@Injectable()
export class PageTitleService {
  projectName: string;
  clusterName: string;
  externalClusterName: string;
  mdName: string;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _titleService: Title,
    private readonly _params: ParamsService,
    private readonly _projectService: ProjectService,
    private readonly _clusterService: ClusterService,
    private readonly _apiService: ApiService
  ) {}

  setTitle(url: string): void {
    const viewName = this._getViewName(url.split('/').reverse());
    this._titleService.setTitle(viewName);

    this._projectService.selectedProject
      .pipe(tap(project => (this.projectName = project ? project.name : '')))
      .pipe(switchMap(_ => this._clusterObservable()))
      .pipe(tap(cluster => (this.clusterName = cluster ? cluster.name : '')))
      .pipe(switchMap(_ => this._externalClusterObservable()))
      .pipe(tap(cluster => (this.externalClusterName = cluster ? cluster.name : '')))
      .pipe(switchMap(_ => this._machineDeploymentObservable()))
      .pipe(tap(md => (this.mdName = md ? md.name : '')))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._titleService.setTitle(this._generateTitle(viewName));
      });
  }

  private _getViewName(urlArray: string[]): string {
    const viewName = urlArray.find(partial => Object.values(View).find(view => view === partial));
    return viewName ? getViewDisplayName(viewName) : '';
  }

  private _generateTitle(viewName: string): string {
    // titleString should at least display the viewName
    let titleString: string = viewName;
    const project = this._params.get(PathParam.ProjectID)
      ? `${ViewDisplayName.Projects.slice(0, -1)} '${this.projectName}'`
      : '';
    const cluster = this._params.get(PathParam.ClusterID)
      ? `${ViewDisplayName.Clusters.slice(0, -1)} '${this.clusterName || this.externalClusterName}' in `
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

  private _clusterObservable(): Observable<Cluster> {
    return this._params.get(PathParam.ProjectID) &&
      this._params.get(PathParam.ClusterID) &&
      this._params.get(PathParam.SeedDC)
      ? this._clusterService.cluster(
          this._params.get(PathParam.ProjectID),
          this._params.get(PathParam.ClusterID),
          this._params.get(PathParam.SeedDC)
        )
      : of(null);
  }

  private _externalClusterObservable(): Observable<Cluster> {
    return this._params.get(PathParam.ProjectID) &&
      this._params.get(PathParam.ClusterID) &&
      !this._params.get(PathParam.SeedDC)
      ? this._clusterService.externalCluster(
          this._params.get(PathParam.ProjectID),
          this._params.get(PathParam.ClusterID)
        )
      : of(null);
  }

  private _machineDeploymentObservable(): Observable<MachineDeployment> {
    return this._params.get(PathParam.ProjectID) &&
      this._params.get(PathParam.ClusterID) &&
      this._params.get(PathParam.MachineDeploymentID) &&
      this._params.get(PathParam.SeedDC)
      ? this._apiService.getMachineDeployment(
          this._params.get(PathParam.MachineDeploymentID),
          this._params.get(PathParam.ClusterID),
          this._params.get(PathParam.SeedDC),
          this._params.get(PathParam.ProjectID)
        )
      : of(null);
  }
}
