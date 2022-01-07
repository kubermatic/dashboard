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
import {ExternalCluster, ExternalClusterProvider, ExternalClusterState} from '@shared/entity/external-cluster';
import {Member} from '@shared/entity/member';
import {ClusterMetrics, NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import {forkJoin, of, Subject, timer} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';
import {MasterVersion} from '@shared/entity/cluster';

@Component({
  selector: 'km-external-cluster-details',
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
  projectID: string;
  cluster: ExternalCluster;
  provider: ExternalClusterProvider;
  machineDeployments: ExternalMachineDeployment[] = [];
  areMachineDeploymentsInitialized = false;
  clusterMetrics: ClusterMetrics;
  nodes: Node[] = [];
  areNodesInitialized = false;
  nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  events: Event[] = [];
  upgrades: MasterVersion[] = [];

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

    this._refreshTimer
      .pipe(
        switchMap(_ => this._clusterService.externalCluster(this.projectID, clusterID)),
        tap(cluster => {
          this.cluster = cluster;
          this.provider = ExternalCluster.getProvider(cluster.cloud);
        }),
        switchMap(_ =>
          forkJoin([
            this.hasUpgrades() ? this._clusterService.externalClusterUpgrades(this.projectID, clusterID) : of([]),
            this.isRunning() ? this._clusterService.externalClusterNodes(this.projectID, clusterID) : of([]),
            this.isRunning() ? this._clusterService.externalMachineDeployments(this.projectID, clusterID) : of([]),
          ])
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe(([upgrades, nodes, machineDeployments]) => {
        this.upgrades = upgrades;
        this.nodes = nodes;
        this.areNodesInitialized = true;
        this.machineDeployments = machineDeployments;
        this.areMachineDeploymentsInitialized = true;
      });

    this._refreshTimer
      .pipe(
        switchMap(_ => this._clusterService.externalClusterEvents(this.projectID, clusterID)),
        takeUntil(this._unsubscribe)
      )
      .subscribe(events => (this.events = events));

    this._metricsRefreshTimer
      .pipe(
        switchMap(_ =>
          forkJoin([
            this._clusterService.externalClusterMetrics(this.projectID, clusterID),
            this._clusterService.externalClusterNodesMetrics(this.projectID, clusterID),
          ])
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([clusterMetrics, nodeMetrics]) => {
        this.clusterMetrics = clusterMetrics;
        this.nodesMetrics = new Map<string, NodeMetrics>(nodeMetrics.map(m => [m.name, m]));
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isRunning(): boolean {
    return this.cluster?.status?.state === ExternalClusterState.Running;
  }

  hasUpgrades(): boolean {
    return this.isRunning() && this.provider !== ExternalClusterProvider.EKS;
  }

  getStatus(): string {
    return ExternalCluster.getStatusMessage(this.cluster);
  }

  getStatusColor(): string {
    return ExternalCluster.getStatusColor(this.cluster);
  }

  canEdit(): boolean {
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

  canDisconnect(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'cluster', Permission.Delete);
  }

  disconnect(): void {
    this._clusterService.showDisconnectClusterDialog(this.cluster, this.projectID).subscribe(_ => {
      this._router.navigate(['/projects/' + this.projectID + '/clusters']);
      this._notificationService.success(`The ${this.cluster.name} cluster was disconnected`);
    });
  }
}
