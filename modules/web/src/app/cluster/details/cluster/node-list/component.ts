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

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {Member} from '@shared/entity/member';
import {NodeMetrics} from '@shared/entity/metrics';
import {Node, NodeIPAddress, VSphereTag, getOperatingSystem, getOperatingSystemLogoClass} from '@shared/entity/node';
import {KubeVirtNodeInstanceType, KubeVirtNodePreference} from '@shared/entity/provider/kubevirt';
import {GroupConfig} from '@shared/model/Config';
import {convertArrayToObject} from '@shared/utils/common';
import {HealthStatus, getNodeHealthStatus} from '@shared/utils/health-status';
import {MemberUtils, Permission} from '@shared/utils/member';
import {NodeUtils} from '@shared/utils/node';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import * as semver from 'semver';

enum Column {
  stateArrow = 'stateArrow',
  status = 'status',
  name = 'name',
  kubeletVersion = 'kubeletVersion',
  ipAddresses = 'ipAddresses',
  creationDate = 'creationDate',
  actions = 'actions',
}

enum ToggleableColumn {
  nodeDetails = 'nodeDetails',
}

@Component({
  selector: 'km-node-list',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class NodeListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cluster: Cluster;
  @Input() mdName: string;
  @Input() nodes: Node[] = [];
  @Input() nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  @Input() projectID: string;
  @Output() deleteNode = new EventEmitter<Node>();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  isShowNodeItem = [];
  dataSource = new MatTableDataSource<Node>();

  readonly toggleableColumns: ToggleableColumn[] = [ToggleableColumn.nodeDetails];
  readonly displayedColumns: Column[] = Object.values(Column);
  readonly column = Column;
  readonly toggleableColumn = ToggleableColumn;

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
    this.sort.active = Column.name;
    this.sort.direction = 'asc';

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.onSortChange(this.dataSource.sort);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSortChange(sort: Sort): void {
    let data = this.nodes;
    if (!sort || !sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    const compare = (a: number | string, b: number | string, isAsc: boolean) => (a < b ? -1 : 1) * (isAsc ? 1 : -1);

    data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case Column.name:
          return compare(a.name, b.name, isAsc);
        case Column.kubeletVersion:
          return semver.compare(a.spec.versions.kubelet, b.spec.versions.kubelet) * (isAsc ? 1 : -1);
        case Column.creationDate:
          return (a.creationTimestamp.valueOf() < b.creationTimestamp.valueOf() ? 1 : -1) * (isAsc ? 1 : -1);
        default:
          return 0;
      }
    });

    this.dataSource.data = data;
  }

  canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'nodes', Permission.Delete);
  }

  deleteNodeDialog(node: Node): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Node',
        message: `Delete <b>${_.escape(node.name)}</b> node of <b>${_.escape(this.mdName)}</b> machine deployment of <b>${_.escape(this.cluster.name)}</b> cluster permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._clusterService.deleteNode(this.projectID, this.cluster.id, node.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(`Removing the ${node.name} node from the ${this.cluster.name} cluster`);
        this._googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeleted');
        this.deleteNode.emit(node);
      });
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

  showInfo(node: Node): boolean {
    return node.name !== node.id.replace('machine-', '') && node.id !== '';
  }

  getInfo(node: Node): string {
    return node.spec.cloud.aws ? node.name : node.id.replace('machine-', '');
  }

  getNodeName(node: Node): string {
    return node.id.replace('machine-', '');
  }

  hasTags(tags: object | Array<any>): boolean {
    if (Array.isArray(tags) && tags.length > 0) {
      return true;
    } else if (typeof tags === 'object') {
      return !!tags && Object.keys(tags).length > 0;
    }
    return false;
  }

  // Note:
  // VSphereNodeSpec has list of tags of type VSphereTag which requires explicit
  // conversion array into object form inorder to pass onto `km-labels` component as Input
  convertVSphereTagsIntoObject(tags: Array<VSphereTag>): VSphereTag | {} {
    return convertArrayToObject(tags, 'name', 'description');
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

  getKubeVirtInstanceTypeCategory(instanceType: KubeVirtNodeInstanceType): string {
    return KubeVirtNodeInstanceType.getCategory(instanceType);
  }

  getKubeVirtPreferenceCategory(preference: KubeVirtNodePreference): string {
    return KubeVirtNodePreference.getCategory(preference);
  }
}
