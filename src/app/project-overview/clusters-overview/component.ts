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

import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {ExternalCluster, ExternalClusterProvider, ExternalClusterState} from '@shared/entity/external-cluster';
import {Cluster} from '@shared/entity/cluster';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {PathParam} from '@core/services/params';
import _ from 'lodash';
import {getClusterHealthStatus, HealthStatus} from '@shared/utils/health-status';
import {Health} from '@shared/entity/health';

@Component({
  selector: 'km-clusters-overview',
  templateUrl: 'template.html',
})
export class ClustersOverviewComponent implements OnInit, OnChanges {
  @Input() clusters: Cluster[] = [];
  @Input() clusterHealth: Health[] = [];
  @Input() externalClusters: ExternalCluster[] = [];
  @Input() externalClustersEnabled = false;
  clusterColumns: string[] = ['status', 'name'];
  clusterDataSource = new MatTableDataSource<Cluster>();
  externalClusterColumns: string[] = ['status', 'name'];
  externalClusterDataSource = new MatTableDataSource<ExternalCluster>();
  projectID = this._activeRoute.snapshot.paramMap.get(PathParam.ProjectID);
  private readonly _maxElements = 10;

  constructor(private readonly _router: Router, private readonly _activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.clusterDataSource.data = this.clustersTop;
    this.externalClusterDataSource.data = this.externalClustersTop;
  }

  ngOnChanges(): void {
    this.clusterDataSource.data = this.clustersTop;
    this.externalClusterDataSource.data = this.externalClustersTop;
  }

  get clustersTop(): Cluster[] {
    return _.take(
      _.sortBy(this.clusters, c => c.name.toLowerCase()),
      this._maxElements
    );
  }

  get externalClustersTop(): ExternalCluster[] {
    return _.take(
      _.sortBy(this.externalClusters, c => c.name.toLowerCase()),
      this._maxElements
    );
  }

  clusterTrackBy(cluster: Cluster): string {
    return cluster.id;
  }

  clusterNavigate(cluster: Cluster): void {
    this._router.navigate([`/projects/${this.projectID}/clusters/${cluster.id}`]);
  }

  getClusterHealthStatus(cluster: Cluster): HealthStatus {
    return getClusterHealthStatus(cluster, this.clusterHealth[cluster.id]);
  }

  externalClusterTrackBy(cluster: ExternalCluster): string {
    return cluster.id;
  }

  externalClusterNavigate(cluster: ExternalCluster): void {
    this._router.navigate([`/projects/${this.projectID}/clusters/external/${cluster.id}`]);
  }

  getExternalClusterStatus(cluster: ExternalCluster): string {
    return ExternalCluster.getStatusMessage(cluster);
  }

  getExternalClusterStatusColor(cluster: ExternalCluster): string {
    return ExternalCluster.getStatusIcon(cluster);
  }

  canAccessExternalCluster(cluster: ExternalCluster): boolean {
    return (
      ExternalCluster.getProvider(cluster.cloud) !== ExternalClusterProvider.Custom ||
      cluster.status.state !== ExternalClusterState.Error
    );
  }
}
