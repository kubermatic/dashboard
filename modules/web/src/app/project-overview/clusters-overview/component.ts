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
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {Router} from '@angular/router';
import {Cluster} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {ExternalCluster, ExternalClusterProvider, ExternalClusterState} from '@shared/entity/external-cluster';
import {Health} from '@shared/entity/health';
import {MachineDeploymentStatus} from '@shared/entity/machine-deployment';
import {Project} from '@shared/entity/project';
import {getClusterHealthStatus, HealthStatus, StatusIcon} from '@shared/utils/health-status';
import _ from 'lodash';

@Component({
  selector: 'km-clusters-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ClustersOverviewComponent implements OnInit, OnChanges {
  @Input() project: Project;
  @Input() clusters: Cluster[] = [];
  @Input() clusterHealth: Health[] = [];
  @Input() clusterMachinesCount: Record<string, MachineDeploymentStatus> = {};
  @Input() externalClusters: ExternalCluster[] = [];
  @Input() externalClustersEnabled = false;
  @Input() isLoadingClusters: boolean;
  @Input() isLoadingExternalClusters: boolean;
  clusterColumns: string[] = ['status', 'name', 'machines'];
  clusterDataSource = new MatTableDataSource<Cluster>();
  externalClusterColumns: string[] = ['status', 'name'];
  kubeOneClusterColumns: string[] = ['status', 'name', 'provider'];
  externalClusterDataSource = new MatTableDataSource<ExternalCluster>();
  kubeOneClusterDataSource = new MatTableDataSource<ExternalCluster>();
  private readonly _maxElements = 10;

  constructor(private readonly _router: Router) {}

  ngOnInit(): void {
    this.clusterDataSource.data = this.clustersTop;
    this.externalClusterDataSource.data = this.externalClustersTop;
    this.kubeOneClusterDataSource.data = this.kubeOneClustersTop;
  }

  ngOnChanges(): void {
    this.clusterDataSource.data = this.clustersTop;
    this.externalClusterDataSource.data = this.externalClustersTop;
    this.kubeOneClusterDataSource.data = this.kubeOneClustersTop;
  }

  get clustersTop(): Cluster[] {
    return _.take(
      _.sortBy(this.clusters, c => c.name.toLowerCase()),
      this._maxElements
    );
  }

  get externalClustersTop(): ExternalCluster[] {
    const externalClusters = this.externalClusters.filter(
      cluster => ExternalCluster.getProvider(cluster.cloud) !== ExternalClusterProvider.KubeOne
    );
    return _.take(
      _.sortBy(externalClusters, c => c.name.toLowerCase()),
      this._maxElements
    );
  }

  get kubeOneClustersTop(): ExternalCluster[] {
    const kubeOneClusters = this.externalClusters.filter(
      cluster => ExternalCluster.getProvider(cluster.cloud) === ExternalClusterProvider.KubeOne
    );
    return _.take(
      _.sortBy(kubeOneClusters, c => c.name.toLowerCase()),
      this._maxElements
    );
  }

  clusterTrackBy(cluster: Cluster): string {
    return cluster.id;
  }

  clusterNavigate(cluster: Cluster): void {
    this._router.navigate([`/projects/${this.project.id}/clusters/${cluster.id}`]);
  }

  clustersNavigate(): void {
    this._router.navigate(['/projects/' + this.project.id + '/clusters']);
  }

  getClusterHealthStatus(cluster: Cluster): HealthStatus {
    return getClusterHealthStatus(cluster, this.clusterHealth[cluster.id]);
  }

  getClusterMDHealthStatus(cluster: Cluster): HealthStatus {
    const mdCount = this.clusterMachinesCount[cluster.id];
    if (
      mdCount &&
      mdCount.replicas === mdCount.availableReplicas &&
      mdCount.availableReplicas === mdCount.updatedReplicas
    ) {
      return new HealthStatus('Running', StatusIcon.Running);
    }
    return new HealthStatus('Updating', StatusIcon.Pending);
  }

  externalClusterTrackBy(cluster: ExternalCluster): string {
    return cluster.id;
  }

  externalClusterNavigate(cluster: ExternalCluster): void {
    this._router.navigate([`/projects/${this.project.id}/${View.Clusters}/${View.ExternalClusters}/${cluster.id}`]);
  }

  externalClustersNavigate(): void {
    this._router.navigate([`/projects/${this.project.id}/${View.ExternalClusters}`]);
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

  kubeOneClusterNavigate(cluster: ExternalCluster): void {
    this._router.navigate(['/projects', this.project.id, View.Clusters, View.KubeOneClusters, cluster.id]);
  }

  kubeOneClustersNavigate(): void {
    this._router.navigate(['/projects', this.project.id, View.KubeOneClusters]);
  }
}
