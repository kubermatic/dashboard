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
import {ExternalClusterDataDialogComponent} from '@shared/components/external-cluster-data-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {Event} from '@shared/entity/event';
import {Member} from '@shared/entity/member';
import {ClusterMetrics, NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import {merge, Subject, timer} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-cluster-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalClusterDetailsComponent implements OnInit, OnDestroy {
  private readonly _refreshTime = 10;
  private readonly _metricsRefreshTime = 5;
  projectId: string;
  cluster: Cluster;
  nodes: Node[] = [];
  metrics: ClusterMetrics;
  nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  events: Event[] = [];
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _clusterRefresh: Subject<void> = new Subject<void>();
  private _metricsRefreshTimer = timer(0, this._appConfigService.getRefreshTimeBase() * this._metricsRefreshTime);
  private _refreshTimer = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _unsubscribe: Subject<void> = new Subject<void>();

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
    this.projectId = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);
    const clusterId = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectId)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    merge(this._refreshTimer, this._clusterRefresh)
      .pipe(switchMap(_ => this._clusterService.externalCluster(this.projectId, clusterId)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cluster => (this.cluster = cluster));

    this._metricsRefreshTimer
      .pipe(switchMap(_ => this._clusterService.externalClusterMetrics(this.projectId, clusterId)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(metrics => (this.metrics = metrics));

    this._metricsRefreshTimer
      .pipe(switchMap(_ => this._clusterService.externalClusterNodesMetrics(this.projectId, clusterId)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(metrics => {
        const map = new Map<string, NodeMetrics>();
        metrics.forEach(m => map.set(m.name, m));
        this.nodesMetrics = map;
      });

    this._refreshTimer
      .pipe(switchMap(_ => this._clusterService.externalClusterNodes(this.projectId, clusterId)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(nodes => (this.nodes = nodes));

    this._refreshTimer
      .pipe(switchMap(_ => this._clusterService.externalClusterEvents(this.projectId, clusterId)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(events => (this.events = events));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'cluster', Permission.Edit);
  }

  edit(): void {
    const dialog = this._matDialog.open(ExternalClusterDataDialogComponent);
    dialog.componentInstance.projectId = this.projectId;
    dialog.componentInstance.name = this.cluster.name;
    dialog.componentInstance.editMode = true;

    dialog
      .afterClosed()
      .pipe(filter(model => !!model))
      .pipe(switchMap(model => this._clusterService.updateExternalCluster(this.projectId, this.cluster.id, model)))
      .pipe(take(1))
      .subscribe(_ => {
        this._clusterRefresh.next();
        this._notificationService.success(`The ${this.cluster.name} cluster was updated`);
      });
  }

  isDisconnectEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'cluster', Permission.Delete);
  }

  disconnect(): void {
    this._clusterService.showDisconnectClusterDialog(this.cluster, this.projectId).subscribe(_ => {
      this._router.navigate(['/projects/' + this.projectId + '/clusters']);
      this._notificationService.success(`The ${this.cluster.name} cluster was disconnected`);
    });
  }
}
