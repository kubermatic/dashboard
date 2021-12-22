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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {PathParam} from '@core/services/params';
import {UserService} from '@core/services/user';
import {EditClusterConnectionDialogComponent} from '@shared/components/external-cluster-data-dialog/component';
import {Event} from '@shared/entity/event';
import {ExternalCluster, ExternalClusterProvider} from '@shared/entity/external-cluster';
import {ExternalMachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {ClusterMetrics, NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import {forkJoin, Subject, timer} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {ExternalCluster, ExternalClusterProvider, ExternalClusterState} from '@shared/entity/external-cluster';

@Component({
  selector: 'km-cluster-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalClusterDetailsComponent implements OnInit, OnDestroy {
  readonly Provider = ExternalClusterProvider;
  readonly ExternalClusterState = ExternalClusterState;
  private readonly _refreshTime = 10;
  private readonly _metricsRefreshTime = 5;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _metricsRefreshTimer = timer(0, this._appConfigService.getRefreshTimeBase() * this._metricsRefreshTime);
  private _refreshTimer = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _unsubscribe: Subject<void> = new Subject<void>();
  readonly Provider = ExternalClusterProvider;
  projectID: string;
  cluster: ExternalCluster;
  provider: ExternalClusterProvider;
  machineDeployments: ExternalMachineDeployment[] = [];
  clusterMetrics: ClusterMetrics;
  nodes: Node[] = [];
  nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  events: Event[] = [];

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _router: Router,
    private readonly _matDialog: MatDialog,
    private readonly _clusterService: ClusterService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _appConfigService: AppConfigService
  ) {}

  ngOnInit(): void {
    this.projectID = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);
    const clusterID = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._clusterService
      .externalCluster(this.projectID, clusterID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cluster => {
        this.cluster = cluster;
        this.provider = ExternalCluster.getProvider(cluster.cloud);
      });

    this._metricsRefreshTimer
      .pipe(switchMap(_ => this._clusterService.externalClusterMetrics(this.projectID, clusterID)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(metrics => (this.clusterMetrics = metrics));

    this._refreshTimer
      .pipe(switchMap(_ => this._clusterService.externalMachineDeployments(this.projectID, clusterID)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(machineDeployments => (this.machineDeployments = machineDeployments));

    this._refreshTimer
      .pipe(
        switchMap(_ =>
          forkJoin([
            this._clusterService.externalClusterNodes(this.projectID, clusterID),
            this._clusterService.externalClusterNodesMetrics(this.projectID, clusterID),
          ])
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([nodes, metrics]) => {
        this.nodes = nodes;
        const map = new Map<string, NodeMetrics>();
        metrics.forEach(m => map.set(m.name, m));
        this.nodesMetrics = map;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getStatus(): string {
    return ExternalCluster.getStatusMessage(this.cluster);
  }

  getStatusColor(): string {
    return ExternalCluster.getStatusColor(this.cluster);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'cluster', Permission.Edit);
  }

  edit(): void {
    const dialog = this._matDialog.open(EditClusterConnectionDialogComponent);
    dialog.componentInstance.projectId = this.projectID;
    dialog.componentInstance.name = this.cluster.name;

    dialog
      .afterClosed()
      .pipe(filter(model => !!model))
      .pipe(switchMap(model => this._clusterService.updateExternalCluster(this.projectID, this.cluster.id, model)))
      .pipe(take(1))
      .subscribe(_ => {
        this._clusterService.onClusterUpdate.next();
        this._notificationService.success(`The ${this.cluster.name} cluster was updated`);
      });
  }

  isDisconnectEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'cluster', Permission.Delete);
  }

  disconnect(): void {
    this._clusterService.showDisconnectClusterDialog(this.cluster, this.projectID).subscribe(_ => {
      this._router.navigate(['/projects/' + this.projectID + '/clusters']);
      this._notificationService.success(`The ${this.cluster.name} cluster was disconnected`);
    });
  }
}
