import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {ProjectService, UserService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {NodeDeployment} from '../../../shared/entity/node-deployment';
import {GroupConfig} from '../../../shared/model/Config';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';
import {NodeDeploymentHealthStatus} from '../../../shared/utils/health-status/node-deployment-health-status';
import {MemberUtils, Permission} from '../../../shared/utils/member-utils/member-utils';
import {NodeUtils} from '../../../shared/utils/node-utils/node-utils';
import {NodeService} from '../../services/node.service';

@Component({
  selector: 'km-node-deployment-list',
  templateUrl: 'node-deployment-list.component.html',
  styleUrls: ['node-deployment-list.component.scss'],
})
export class NodeDeploymentListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() nodeDeployments: NodeDeployment[] = [];
  @Input() projectID: string;
  @Input() clusterHealthStatus: ClusterHealthStatus;
  @Input() isClusterRunning: boolean;
  @Input() isNodeDeploymentLoadFinished: boolean;
  @Output() changeNodeDeployment = new EventEmitter<NodeDeployment>();
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  dataSource = new MatTableDataSource<NodeDeployment>();
  displayedColumns: string[] = ['status', 'name', 'labels', 'replicas', 'ver', 'os', 'created', 'actions'];

  private _unsubscribe: Subject<any> = new Subject();
  private _user: MemberEntity;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _router: Router,
    private readonly _nodeService: NodeService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.nodeDeployments ? this.nodeDeployments : [];
    this.dataSource.paginator = this.paginator;

    this._userService.loggedInUser.subscribe(user => (this._user = user));

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(project => this._userService.currentUserGroup(project.id)))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.userGroupConfig(userGroup)));

    if (this.cluster.spec.cloud.aws) {
      this.displayedColumns = ['status', 'name', 'replicas', 'ver', 'availabilityZone', 'os', 'created', 'actions'];
    }
  }

  ngOnChanges(): void {
    this.dataSource.data = this.nodeDeployments ? this.nodeDeployments : [];
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<NodeDeployment> {
    this.dataSource.data = this.nodeDeployments ? this.nodeDeployments : [];
    return this.dataSource;
  }

  getHealthStatus(nd: NodeDeployment): NodeDeploymentHealthStatus {
    return NodeDeploymentHealthStatus.getHealthStatus(nd);
  }

  getOperatingSystem(nd: NodeDeployment): string {
    return NodeUtils.getOperatingSystem(nd.spec.template);
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterEntity.getVersionHeadline(type, isKubelet);
  }

  goToDetails(nd: NodeDeployment): void {
    this._router.navigate([
      '/projects/' +
        this.projectID +
        '/dc/' +
        this.datacenter.metadata.name +
        '/clusters/' +
        this.cluster.id +
        /nd/ +
        nd.id,
    ]);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'nodeDeployments', Permission.Edit);
  }

  showEditDialog(nd: NodeDeployment, event: Event): void {
    event.stopPropagation();
    this._nodeService
      .showNodeDeploymentEditDialog(nd, this.cluster, this.projectID, this.datacenter, this.changeNodeDeployment)
      .subscribe(() => {});
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'nodeDeployments', Permission.Delete);
  }

  showDeleteDialog(nd: NodeDeployment, event: Event): void {
    event.stopPropagation();
    this._nodeService
      .showNodeDeploymentDeleteDialog(
        nd,
        this.cluster.id,
        this.projectID,
        this.datacenter.metadata.name,
        this.changeNodeDeployment
      )
      .subscribe(() => {});
  }

  hasItems(): boolean {
    return !!this.nodeDeployments && this.nodeDeployments.length > 0;
  }

  isPaginatorVisible(): boolean {
    return this.hasItems() && this.paginator && this.nodeDeployments.length > this.paginator.pageSize;
  }
}
