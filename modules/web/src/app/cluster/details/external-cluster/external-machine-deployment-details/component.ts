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
import {MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig} from '@angular/material/legacy-dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {PathParam} from '@core/services/params';
import {UserService} from '@core/services/user';
import {Datacenter} from '@shared/entity/datacenter';
import {Event} from '@shared/entity/event';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';
import {Member} from '@shared/entity/member';
import {NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import {forkJoin, Subject, timer} from 'rxjs';
import {switchMap, take, takeUntil} from 'rxjs/operators';
import {ExternalMachineDeploymentService} from '@core/services/external-machine-deployment';
import {UpdateExternalClusterMachineDeploymentDialogComponent} from '../update-external-cluster-machine-deployment-dialog/component';
import {HealthStatus} from '@shared/utils/health-status';

@Component({
  selector: 'km-external-machine-deployment-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalMachineDeploymentDetailsComponent implements OnInit, OnDestroy {
  private readonly _refreshTime = 10;
  private readonly _unsubscribe: Subject<void> = new Subject<void>();
  machineDeployment: ExternalMachineDeployment;
  machineDeploymentHealthStatus: HealthStatus;
  nodes: Node[] = [];
  areNodesInitialized = false;
  events: Event[] = [];
  metrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  cluster: ExternalCluster;
  clusterProvider: string;
  datacenter: Datacenter;
  projectID: string;
  private _machineDeploymentID: string;
  private _isMachineDeploymentLoaded = false;
  private _clusterID: string;
  private _isClusterLoaded = false;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _matDialog: MatDialog,
    private readonly _appConfig: AppConfigService,
    private readonly _userService: UserService,
    private readonly _clusterService: ClusterService,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this._clusterID = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);
    this._machineDeploymentID = this._activatedRoute.snapshot.paramMap.get(PathParam.MachineDeploymentID);
    this.projectID = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase())
      .pipe(
        switchMap(_ =>
          forkJoin([
            this._clusterService.externalMachineDeployment(this.projectID, this._clusterID, this._machineDeploymentID),
            this._clusterService.externalMachineDeploymentNodes(
              this.projectID,
              this._clusterID,
              this._machineDeploymentID
            ),
            this._clusterService.externalMachineDeploymentNodesEvents(
              this.projectID,
              this._clusterID,
              this._machineDeploymentID
            ),
            this._clusterService.externalMachineDeploymentNodesMetrics(
              this.projectID,
              this._clusterID,
              this._machineDeploymentID
            ),
          ])
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([md, nodes, nodeEvents, nodeMetrics]) => {
        this._isMachineDeploymentLoaded = true;
        this.machineDeployment = md;
        this.machineDeploymentHealthStatus = this._getHealthStatus();
        this.nodes = nodes;
        this.areNodesInitialized = true;
        this.events = nodeEvents;
        this._storeNodeMetrics(nodeMetrics);
      });

    this._clusterService
      .externalCluster(this.projectID, this._clusterID)
      .pipe(take(1))
      .subscribe(c => {
        this.cluster = c;
        this.clusterProvider = ExternalCluster.getProvider(this.cluster.cloud);
        this._isClusterLoaded = true;
      });
  }

  isInitialized(): boolean {
    return this._isMachineDeploymentLoaded && this._isClusterLoaded;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Edit);
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Delete);
  }

  updateMachineDeployment(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        projectID: this.projectID,
        clusterID: this.cluster.id,
        machineDeployment: this.machineDeployment,
        replicas: this.machineDeployment.spec?.replicas,
        kubeletVersion: this.machineDeployment.spec?.template?.versions?.kubelet,
      },
    };
    this._matDialog.open(UpdateExternalClusterMachineDeploymentDialogComponent, dialogConfig);
  }

  showDeleteDialog(): void {
    this._externalMachineDeploymentService
      .showExternalMachineDeploymentDeleteDialog(this.projectID, this.cluster, this.machineDeployment)
      .subscribe(isDeploymentDeleted => {
        if (isDeploymentDeleted) {
          this._goBack();
        }
      });
  }

  private _getHealthStatus(): HealthStatus {
    return ExternalMachineDeployment.getHealthStatus(this.machineDeployment);
  }

  private _goBack(): void {
    this._router.navigateByUrl(`projects/${this.projectID}/clusters/externalclusters/${this.cluster.id}`);
  }

  private _storeNodeMetrics(metrics: NodeMetrics[]): void {
    const map = new Map<string, NodeMetrics>();
    metrics.forEach(m => map.set(m.name, m));
    this.metrics = map;
  }
}
