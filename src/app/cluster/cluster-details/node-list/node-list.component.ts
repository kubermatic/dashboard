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

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Subject} from 'rxjs';
import {filter, first, switchMap, takeUntil} from 'rxjs/operators';
import * as _ from 'lodash';

import {ClusterService, NotificationService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '../../../shared/entity/cluster';
import {Member} from '../../../shared/entity/member';
import {NodeMetrics} from '../../../shared/entity/metrics';
import {getOperatingSystem, getOperatingSystemLogoClass, Node} from '../../../shared/entity/node';
import {GroupConfig} from '../../../shared/model/Config';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';
import {NodeHealthStatus} from '../../../shared/utils/health-status/node-health-status';
import {MemberUtils, Permission} from '../../../shared/utils/member-utils/member-utils';

@Component({
  selector: 'km-node-list',
  templateUrl: 'node-list.component.html',
  styleUrls: ['node-list.component.scss'],
})
export class NodeListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cluster: Cluster;
  @Input() seed: string;
  @Input() nodes: Node[] = [];
  @Input() nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  @Input() projectID: string;
  @Output() deleteNode = new EventEmitter<Node>();
  @Input() clusterHealthStatus: ClusterHealthStatus;
  @Input() isClusterRunning: boolean;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  config: MatDialogConfig = {
    disableClose: false,
    hasBackdrop: true,
  };
  isShowNodeItem = [];
  displayedColumns: string[] = [
    'stateArrow',
    'status',
    'name',
    'kubeletVersion',
    'ipAddresses',
    'creationDate',
    'actions',
  ];
  toggledColumns: string[] = ['nodeDetails'];
  dataSource = new MatTableDataSource<Node>();

  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _clusterService: ClusterService,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.nodes;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUser.pipe(first()).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

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

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return Cluster.getVersionHeadline(type, isKubelet);
  }

  canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'nodes', Permission.Delete);
  }

  deleteNodeDialog(node: Node, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Node',
        message: `Are you sure you want to permanently delete node <strong>${node.name}</strong>?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._clusterService.deleteNode(this.projectID, this.cluster.id, this.seed, node.id)))
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(
          `The <strong>${node.name}</strong> node was removed from the <strong>${this.cluster.name}</strong> cluster`
        );
        this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeleted');
        this.deleteNode.emit(node);
      });
  }

  getNodeHealthStatus(n: Node, i: number): object {
    return NodeHealthStatus.getHealthStatus(n);
  }

  getFormattedNodeMemory(memory: string): string {
    const memRE = /([0-9]+)([a-zA-Z])i/;
    const resRE = memory.match(memRE);
    const base = 1024;
    const radix = 10;
    const fractionDigits = 2;

    let nodeCapacity;
    const prefixes = ['Ki', 'Mi', 'Gi', 'Ti'];
    let i = 0;

    if (resRE) {
      let ki = parseInt(resRE[1], radix);
      do {
        ki /= base;
        i++;
      } while (ki > 1);
      nodeCapacity = (ki * base).toFixed(fractionDigits);
    }

    return nodeCapacity ? `${nodeCapacity} ${prefixes[i - 1]}` : 'unknown';
  }

  getAddresses(node: Node): object {
    const addresses = {};
    for (const i in node.status.addresses) {
      if (node.status.addresses[i].type === 'InternalIP') {
        addresses['InternalIP'] = node.status.addresses[i].address;
      } else if (node.status.addresses[i].type === 'ExternalIP') {
        addresses['ExternalIP'] = node.status.addresses[i].address;
      }
    }
    return addresses;
  }

  showInfo(node: Node): boolean {
    return node.name !== node.id.replace('machine-', '') && node.id !== '';
  }

  getInfo(node: Node): string {
    if (node.spec.cloud.aws) {
      return node.name;
    }
    return node.id.replace('machine-', '');
  }

  getNodeName(node: Node): string {
    return node.id.replace('machine-', '');
  }

  displayTags(tags: object): boolean {
    return !!tags && Object.keys(tags).length > 0;
  }

  toggleNodeItem(element: Node): void {
    const elem = event.target as HTMLElement;
    const className = elem.className;
    if (className !== 'km-copy') {
      this.isShowNodeItem[element.id] = !this.isShowNodeItem[element.id];
    }
  }

  getSystem(node: Node): string {
    return getOperatingSystem(node.spec);
  }

  getSystemLogoClass(node: Node): string {
    return getOperatingSystemLogoClass(node.spec);
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.nodes) && this.paginator && this.nodes.length > this.paginator.pageSize;
  }

  getMetrics(nodeName: string): NodeMetrics | undefined {
    return this.nodesMetrics.get(nodeName);
  }
}
