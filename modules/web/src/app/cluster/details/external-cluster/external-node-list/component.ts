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

import {Component, Input, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {UserService} from '@core/services/user';
import {ExternalCluster, ExternalClusterState} from '@shared/entity/external-cluster';
import {NodeMetrics} from '@shared/entity/metrics';
import {Node, NodeIPAddress} from '@shared/entity/node';
import {HealthStatus, getNodeHealthStatus} from '@shared/utils/health-status';
import {NodeUtils} from '@shared/utils/node';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-external-node-list',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ExternalNodeListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cluster: ExternalCluster;
  @Input() nodes: Node[] = [];
  @Input() nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  @Input() projectID: string;
  @Input() isInitialized = false;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  isShowNodeItem = [];
  displayedColumns: string[] = ['stateArrow', 'status', 'name', 'kubeletVersion', 'ipAddresses', 'creationDate'];
  toggledColumns: string[] = ['nodeDetails'];
  dataSource = new MatTableDataSource<Node>();

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _userService: UserService) {}

  ngOnInit(): void {
    this.dataSource.data = this.nodes;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.nodes;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isLoadingData(): boolean {
    return (_.isEmpty(this.nodes) && !this.isRunning()) || !this.isInitialized;
  }

  hasNoData(): boolean {
    return _.isEmpty(this.nodes) && this.isRunning() && this.isInitialized;
  }

  isRunning(): boolean {
    return this.cluster?.status?.state === ExternalClusterState.Running;
  }

  getNodeHealthStatus(n: Node): HealthStatus {
    return getNodeHealthStatus(n);
  }

  getFormattedNodeMemory(memory: string): string {
    return NodeUtils.getFormattedNodeMemory(memory);
  }

  getAddresses(node: Node): NodeIPAddress {
    return NodeUtils.getAddresses(node);
  }

  toggleNodeItem(element: Node): void {
    const elem = event.target as HTMLElement;
    const className = elem.className;
    if (className !== 'km-copy') {
      this.isShowNodeItem[element.id] = !this.isShowNodeItem[element.id];
    }
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.nodes) && this.paginator && this.nodes.length > this.paginator.pageSize;
  }

  getMetrics(nodeName: string): NodeMetrics | undefined {
    return this.nodesMetrics.get(nodeName);
  }
}
