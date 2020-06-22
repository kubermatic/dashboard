import {Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {Subject, of} from 'rxjs';
import {takeUntil, switchMap, tap} from 'rxjs/operators';

import {ProjectService, ClusterService, ApiService} from '../../services';
import {ParamsService, PathParam} from '../../services/params/params.service';

export enum PageView {
  Clusters = 'clusters',
  Projects = 'projects',
  Members = 'members',
  SSHKeys = 'sshkeys',
  ServiceAccounts = 'serviceaccounts',
  Wizard = 'wizard',
  Account = 'account',
  Settings = 'settings',
  NodeDeployment = 'nd',
}

@Injectable()
export class PageTitleService {
  projectName: string;
  clusterName: string;
  ndName: string;
  private _unsubscribe = new Subject<void>();

  constructor(
    private titleService: Title,
    private readonly _params: ParamsService,
    private readonly _projectService: ProjectService,
    private readonly _clusterService: ClusterService,
    private readonly _apiService: ApiService
  ) {}

  setTitle(url: string): void {
    const viewName = this.getPageViewName(url.split('/'));
    this.titleService.setTitle(viewName);

    this._projectService.selectedProject
      .pipe(tap(project => (this.projectName = project ? project.name : '')))
      .pipe(
        switchMap(() =>
          this._params.get(PathParam.ProjectID) &&
          this._params.get(PathParam.ClusterID) &&
          this._params.get(PathParam.SeedDC)
            ? this._clusterService.cluster(
                this._params.get(PathParam.ProjectID),
                this._params.get(PathParam.ClusterID),
                this._params.get(PathParam.SeedDC)
              )
            : of(null)
        )
      )
      .pipe(tap(cluster => (this.clusterName = cluster ? cluster.name : '')))
      .pipe(
        switchMap(() =>
          this._params.get(PathParam.ProjectID) &&
          this._params.get(PathParam.ClusterID) &&
          this._params.get(PathParam.NodeDeploymentID) &&
          this._params.get(PathParam.SeedDC)
            ? this._apiService.getNodeDeployment(
                this._params.get(PathParam.NodeDeploymentID),
                this._params.get(PathParam.ClusterID),
                this._params.get(PathParam.SeedDC),
                this._params.get(PathParam.ProjectID)
              )
            : of(null)
        )
      )
      .pipe(tap(nd => (this.ndName = nd ? nd.name : '')))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        if (this._params.get(PathParam.ProjectID)) {
          if (this._params.get(PathParam.ClusterID)) {
            if (this._params.get(PathParam.NodeDeploymentID)) {
              this.titleService.setTitle(
                "node deployment '" +
                  this.ndName +
                  "' in cluster '" +
                  this.clusterName +
                  "' in project '" +
                  this.projectName +
                  "'"
              );
            } else {
              this.titleService.setTitle("cluster '" + this.clusterName + "' in project '" + this.projectName + "'");
            }
          } else {
            this.titleService.setTitle(viewName + " in project '" + this.projectName + "'");
          }
        } else {
          this.titleService.setTitle(viewName);
        }
      });
  }

  getPageViewName(urlArray: string[]): string {
    switch (urlArray[urlArray.length - 1]) {
      case PageView.Clusters:
        return 'clusters';
      case PageView.Members:
        return 'members';
      case PageView.ServiceAccounts:
        return 'service accounts';
      case PageView.SSHKeys:
        return 'ssh keys';
      case PageView.Wizard:
        return 'wizard';
      case PageView.Projects:
        return 'projects';
      case PageView.Account:
        return 'user settings';
      case PageView.Settings:
        return 'admin panel';
      default:
        switch (urlArray[urlArray.length - 2]) {
          case PageView.Clusters:
            return 'cluster';
          case PageView.NodeDeployment:
            return 'node deployment';
          default:
            return '';
        }
    }
  }
}
