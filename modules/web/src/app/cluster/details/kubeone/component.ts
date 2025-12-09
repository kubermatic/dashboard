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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {View} from '@app/shared/entity/common';
import {ClusterService} from '@core/services/cluster';
import {ExternalClusterService} from '@core/services/external-cluster';
import {PathParam} from '@core/services/params';
import {UserService} from '@core/services/user';
import {ContainerRuntime, MasterVersion} from '@shared/entity/cluster';
import {Event} from '@shared/entity/event';
import {ExternalCluster, ExternalClusterProvider, ExternalClusterState} from '@shared/entity/external-cluster';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';
import {Member} from '@shared/entity/member';
import {ClusterMetrics, NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import {forkJoin, of, Subject, timer} from 'rxjs';
import {switchMap, take, takeUntil, tap} from 'rxjs/operators';

@Component({
  selector: 'km-kubeone-cluster-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class KubeOneClusterDetailsComponent implements OnInit, OnDestroy {
  readonly Provider = ExternalClusterProvider;
  readonly ContainerRuntime = ContainerRuntime;
  private readonly _refreshTime = 10;
  private readonly _metricsRefreshTime = 5;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _metricsRefreshTimer = timer(0, this._appConfigService.getRefreshTimeBase() * this._metricsRefreshTime);
  private _refreshTimer = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _unsubscribe: Subject<void> = new Subject<void>();
  projectID: string;
  cluster: ExternalCluster;
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
    private readonly _clusterService: ClusterService,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _userService: UserService,
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

  enableDownloadKubeconfigButton(): boolean {
    const clusterState = this.cluster?.status.state;
    if (!clusterState) {
      return false;
    }
    switch (clusterState) {
      case ExternalClusterState.Deleting:
      case ExternalClusterState.Error:
      case ExternalClusterState.Provisioning:
      case ExternalClusterState.Unknown:
        return false;
      default:
        return true;
    }
  }

  downloadKubeconfig(): void {
    window.open(this._clusterService.getExternalKubeconfigURL(this.projectID, this.cluster.id), '_blank', 'noopener,noreferrer');
  }

  hasUpgrades(): boolean {
    return this.isRunning();
  }

  getStatus(): string {
    return ExternalCluster.getStatusMessage(this.cluster);
  }

  getStatusColor(): string {
    return ExternalCluster.getStatusIcon(this.cluster);
  }

  goBack(): void {
    this._router.navigate([`/projects/${this.projectID}/${View.KubeOneClusters}`]);
  }

  canEdit(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Edit);
  }

  canDisconnect(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'cluster', Permission.Delete);
  }

  disconnectCluster(): void {
    this._externalClusterService.showDisconnectClusterDialog(this.cluster, this.projectID);
  }
}
