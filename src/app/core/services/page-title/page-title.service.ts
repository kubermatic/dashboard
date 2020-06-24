import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Subject, of, Observable} from 'rxjs';
import {takeUntil, switchMap, tap} from 'rxjs/operators';

import {ProjectService, ClusterService, ApiService} from '../../services';
import {ParamsService, PathParam} from '../../services/params/params.service';
import {Cluster} from '../../../shared/entity/cluster';
import {View, getViewDisplayName, ViewDisplayName} from '../../../shared/entity/common';
import {NodeDeployment} from '../../../shared/entity/node-deployment';

@Injectable()
export class PageTitleService {
  projectName: string;
  clusterName: string;
  ndName: string;
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
      .pipe(switchMap(_ => this._nodeDeploymentObservable()))
      .pipe(tap(nd => (this.ndName = nd ? nd.name : '')))
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
      ? `${ViewDisplayName.Clusters.slice(0, -1)} '${this.clusterName}' in `
      : '';
    const nd = this._params.get(PathParam.NodeDeploymentID)
      ? `${ViewDisplayName.NodeDeployment} '${this.ndName}' in `
      : '';

    // if project isn't empty, project string should be added to viewName
    if (project) {
      titleString += ` in ${project}`;
    }

    // as node deployments could not work without a cluster:
    // if cluster isn't empty, remove viewName from title and display node deployment, cluster and project string
    if (cluster) {
      titleString = nd + cluster + project;
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

  private _nodeDeploymentObservable(): Observable<NodeDeployment> {
    return this._params.get(PathParam.ProjectID) &&
      this._params.get(PathParam.ClusterID) &&
      this._params.get(PathParam.NodeDeploymentID) &&
      this._params.get(PathParam.SeedDC)
      ? this._apiService.getNodeDeployment(
          this._params.get(PathParam.NodeDeploymentID),
          this._params.get(PathParam.ClusterID),
          this._params.get(PathParam.SeedDC),
          this._params.get(PathParam.ProjectID)
        )
      : of(null);
  }
}
