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
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {PathParam} from '@core/services/params';
import {Datacenter} from '@shared/entity/datacenter';
import {Event} from '@shared/entity/event';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {forkJoin, Subject, timer} from 'rxjs';
import {switchMap, take, takeUntil} from 'rxjs/operators';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';

@Component({
  selector: 'km-external-machine-deployment-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalMachineDeploymentDetailsComponent implements OnInit, OnDestroy {
  private readonly _refreshTime = 10; // in seconds
  private readonly _unsubscribe: Subject<void> = new Subject<void>();
  private _machineDeploymentID: string;
  private _isMachineDeploymentLoaded = false;
  private _clusterID: string;
  private _isClusterLoaded = false;
  machineDeployment: ExternalMachineDeployment;
  nodes: Node[] = [];
  events: Event[] = [];
  metrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  cluster: ExternalCluster;
  clusterProvider: string;
  datacenter: Datacenter;
  projectID: string;

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _appConfig: AppConfigService,
    private readonly _clusterService: ClusterService
  ) {}

  ngOnInit(): void {
    this._clusterID = this._activatedRoute.snapshot.paramMap.get(PathParam.ClusterID);
    this._machineDeploymentID = this._activatedRoute.snapshot.paramMap.get(PathParam.MachineDeploymentID);
    this.projectID = this._activatedRoute.snapshot.paramMap.get(PathParam.ProjectID);

    timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase())
      .pipe(
        switchMap(_ =>
          forkJoin([
            this._clusterService.externalMachineDeployment(this.projectID, this._clusterID, this._machineDeploymentID),
            this._clusterService.externalClusterNodes(this.projectID, this._clusterID),
            this._clusterService.externalClusterEvents(this.projectID, this._clusterID),
            this._clusterService.externalClusterNodesMetrics(this.projectID, this._clusterID),
          ])
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([md, nodes, nodeEvents, nodeMetrics]) => {
        this._isMachineDeploymentLoaded = true;
        this.machineDeployment = md;
        this.nodes = nodes;
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

  getStatusColor(): string {
    return ExternalMachineDeployment.getStatusColor(this.machineDeployment);
  }

  private _storeNodeMetrics(metrics: NodeMetrics[]): void {
    const map = new Map<string, NodeMetrics>();
    metrics.forEach(m => map.set(m.name, m));
    this.metrics = map;
  }
}
