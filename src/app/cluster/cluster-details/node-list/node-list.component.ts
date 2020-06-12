import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Subject} from 'rxjs';
import {filter, first, switchMap, takeUntil} from 'rxjs/operators';

import {ClusterService, NotificationService, UserService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {Cluster} from '../../../shared/entity/cluster';
import {Datacenter} from '../../../shared/entity/datacenter';
import {Member} from '../../../shared/entity/Member';
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
  @Input() datacenter: Datacenter;
  @Input() nodes: Node[] = [];
  @Input() nodesMetrics: Map<string, NodeMetrics> = new Map<string, NodeMetrics>();
  @Input() projectID: string;
  @Output() deleteNode = new EventEmitter<Node>();
  @Input() clusterHealthStatus: ClusterHealthStatus;
  @Input() isClusterRunning: boolean;
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
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _clusterService: ClusterService,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.nodes;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.loggedInUser.pipe(first()).subscribe(user => (this._user = user));

    this._userService
      .currentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.userGroupConfig(userGroup)));

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
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
        message: `Are you sure you want to permanently delete node "<strong>${node.name}</strong>"?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ =>
          this._clusterService.deleteNode(this.projectID, this.cluster.id, this.datacenter.metadata.name, node.id)
        )
      )
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

    let nodeCapacity;
    const prefixes = ['Ki', 'Mi', 'Gi', 'Ti'];
    let i = 0;

    if (resRE) {
      let ki = parseInt(resRE[1], 10);
      do {
        ki /= 1024;
        i++;
      } while (ki > 1);
      nodeCapacity = (ki * 1024).toFixed(2);
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

  hasItems(): boolean {
    return !!this.nodes && this.nodes.length > 0;
  }

  isPaginatorVisible(): boolean {
    return this.hasItems() && this.paginator && this.nodes.length > this.paginator.pageSize;
  }

  getMetrics(nodeName: string): NodeMetrics | undefined {
    return this.nodesMetrics.get(nodeName);
  }
}
