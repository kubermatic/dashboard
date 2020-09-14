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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject} from 'rxjs';

import {Cluster} from '../../shared/entity/cluster';
import {Event} from '../../shared/entity/event';
import {ClusterMetrics, NodeMetrics} from '../../shared/entity/metrics';

import {PathParam} from '../../core/services/params/params.service';
import {ClusterService, NotificationService, UserService} from '../../core/services';
import {take, takeUntil} from 'rxjs/operators';
import {Member} from '../../shared/entity/member';
import {MemberUtils, Permission} from '../../shared/utils/member-utils/member-utils';
import {GroupConfig} from '../../shared/model/Config';
import {Node} from '../../shared/entity/node';

@Component({
  selector: 'km-cluster-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalClusterDetailsComponent implements OnInit, OnDestroy {
  projectId: string;
  cluster: Cluster;
  nodes: Node[] = [];
  metrics: ClusterMetrics;
  nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  events: Event[] = [];
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _clusterService: ClusterService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);
    const clusterId = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectId)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._clusterService
      .externalCluster(this.projectId, clusterId)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cluster => (this.cluster = cluster));

    this._clusterService
      .externalClusterMetrics(this.projectId, clusterId)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(metrics => (this.metrics = metrics));

    this._clusterService
      .externalClusterNodesMetrics(this.projectId, clusterId)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(metrics => {
        const map = new Map<string, NodeMetrics>();
        metrics.forEach(m => map.set(m.name, m));
        this.nodesMetrics = map;
      });

    this._clusterService
      .externalClusterNodes(this.projectId, clusterId)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(nodes => (this.nodes = nodes));

    this._clusterService
      .externalClusterEvents(this.projectId, clusterId)
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
    // TODO
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'cluster', Permission.Delete);
  }

  delete(): void {
    this._clusterService.showDeleteExternalClusterDialog(this.cluster, this.projectId).subscribe(_ => {
      this._router.navigate(['/projects/' + this.projectId + '/clusters']);
      this._notificationService.success(`The <strong>${this.cluster.name}</strong> cluster was removed`);
    });
  }
}
