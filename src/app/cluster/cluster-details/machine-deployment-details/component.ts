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
import {AppConfigService} from '@app/config.service';
import {ApiService} from '@core/services/api';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NodeService} from '@core/services/node';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {Cluster} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {Event} from '@shared/entity/event';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {NodeMetrics} from '@shared/entity/metrics';
import {getOperatingSystem, getOperatingSystemLogoClass, Node} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MachineDeploymentHealthStatus} from '@shared/utils/health-status/machine-deployment-health-status';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import {Subject, timer} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {PathParam} from '@core/services/params';

@Component({
  selector: 'km-machine-deployment-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class MachineDeploymentDetailsComponent implements OnInit, OnDestroy {
  machineDeployment: MachineDeployment;
  machineDeploymentHealthStatus: MachineDeploymentHealthStatus;
  nodes: Node[] = [];
  events: Event[] = [];
  metrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  cluster: Cluster;
  clusterProvider: string;
  datacenter: Datacenter;
  system: string;
  systemLogoClass: string;
  projectID: string;

  private readonly _refreshTime = 10; // in seconds
  private _machineDeploymentID: string;
  private _isMachineDeploymentLoaded = false;
  private _areNodesLoaded = false;
  private _areNodesEventsLoaded = false;
  private _isClusterLoaded = false;
  private _isDatacenterLoaded = false;
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _clusterName: string;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _router: Router,
    private readonly _apiService: ApiService,
    private readonly _datacenterService: DatacenterService,
    private readonly _nodeService: NodeService,
    private readonly _appConfig: AppConfigService,
    private readonly _userService: UserService,
    private readonly _clusterService: ClusterService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._clusterName = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);
    this._machineDeploymentID = this._activatedRoute.snapshot.paramMap.get(PathParam.MachineDeploymentID);
    this.projectID = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.loadMachineDeployment();
        this.loadNodes();
        this.loadNodesEvents();
        this.loadNodesMetrics();
      });

    this.loadCluster();
  }

  loadMachineDeployment(): void {
    this._apiService
      .getMachineDeployment(this._machineDeploymentID, this._clusterName, this.projectID)
      .pipe(take(1))
      .subscribe((md: MachineDeployment) => {
        this.machineDeployment = md;
        this.system = getOperatingSystem(this.machineDeployment.spec.template);
        this.systemLogoClass = getOperatingSystemLogoClass(this.machineDeployment.spec.template);
        this.machineDeploymentHealthStatus = MachineDeploymentHealthStatus.getHealthStatus(this.machineDeployment);
        this._isMachineDeploymentLoaded = true;
      });
  }

  loadNodes(): void {
    this._apiService
      .getMachineDeploymentNodes(this._machineDeploymentID, this._clusterName, this.projectID)
      .pipe(take(1))
      .subscribe(n => {
        this.nodes = n;
        this._areNodesLoaded = true;
      });
  }

  loadNodesEvents(): void {
    this._apiService
      .getMachineDeploymentNodesEvents(this._machineDeploymentID, this._clusterName, this.projectID)
      .pipe(take(1))
      .subscribe(e => {
        this.events = e;
        this._areNodesEventsLoaded = true;
      });
  }

  loadNodesMetrics(): void {
    this._apiService
      .getMachineDeploymentNodesMetrics(this._machineDeploymentID, this._clusterName, this.projectID)
      .pipe(take(1))
      .subscribe(metrics => this._storeNodeMetrics(metrics));
  }

  loadCluster(): void {
    this._clusterService
      .cluster(this.projectID, this._clusterName)
      .pipe(take(1))
      .subscribe(c => {
        this.cluster = c;
        this.clusterProvider = Cluster.getProvider(this.cluster.spec.cloud);
        this._isClusterLoaded = true;
        this.loadDatacenter();
      });
  }

  loadDatacenter(): void {
    this._datacenterService
      .getDatacenter(this.cluster.spec.cloud.dc)
      .pipe(take(1))
      .subscribe(d => {
        this.datacenter = d;
        this._isDatacenterLoaded = true;
      });
  }

  isInitialized(): boolean {
    return (
      this._isClusterLoaded &&
      this._isDatacenterLoaded &&
      this._areNodesLoaded &&
      this._isMachineDeploymentLoaded &&
      this._areNodesEventsLoaded
    );
  }

  getProjectID(): string {
    return this.projectID;
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return Cluster.getVersionHeadline(type, isKubelet);
  }

  goBackToCluster(): void {
    this._router.navigate(['/projects/' + this.projectID + '/clusters/' + this._clusterName]);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Edit);
  }

  showEditDialog(): void {
    this._nodeService
      .showMachineDeploymentEditDialog(this.machineDeployment, this.cluster, this.projectID)
      .pipe(take(1))
      .subscribe(
        _ => {
          this.loadMachineDeployment();
          this.loadNodes();
          this._notificationService.success(`The ${this.machineDeployment.name} machine deployment was updated`);
        },
        _ => this._notificationService.error('There was an error during machine deployment edition.')
      );
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Delete);
  }

  showDeleteDialog(): void {
    this._nodeService
      .showMachineDeploymentDeleteDialog(this.machineDeployment, this.cluster.id, this.projectID, undefined)
      .subscribe(isConfirmed => {
        if (isConfirmed) {
          this.goBackToCluster();
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _storeNodeMetrics(metrics: NodeMetrics[]): void {
    const map = new Map<string, NodeMetrics>();
    metrics.forEach(m => map.set(m.name, m));
    this.metrics = map;
  }
}
