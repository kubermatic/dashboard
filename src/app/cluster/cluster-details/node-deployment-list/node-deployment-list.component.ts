import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {ProjectService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {ClusterUtils} from '../../../shared/utils/cluster-utils/cluster-utils';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';
import {NodeDeploymentHealthStatus} from '../../../shared/utils/health-status/node-deployment-health-status';
import {NodeUtils} from '../../../shared/utils/node-utils/node-utils';
import {NodeService} from '../../services/node.service';

@Component({
  selector: 'kubermatic-node-deployment-list',
  templateUrl: 'node-deployment-list.component.html',
  styleUrls: ['node-deployment-list.component.scss'],
})
export class NodeDeploymentListComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() nodeDeployments: NodeDeploymentEntity[] = [];
  @Input() projectID: string;
  @Input() clusterHealthStatus: ClusterHealthStatus;
  @Input() isClusterRunning: boolean;
  @Input() isNodeDeploymentLoadFinished: boolean;
  @Output() changeNodeDeployment = new EventEmitter<NodeDeploymentEntity>();
  dataSource = new MatTableDataSource<NodeDeploymentEntity>();
  displayedColumns: string[] = ['status', 'name', 'replicas', 'ver', 'os', 'created', 'actions'];

  private _unsubscribe: Subject<any> = new Subject();
  private _currentGroupConfig: GroupConfig;

  constructor(
      private readonly _router: Router, private readonly _nodeService: NodeService,
      private readonly _projectService: ProjectService, private readonly _userService: UserService) {}

  ngOnInit(): void {
    this.dataSource.data = this.nodeDeployments ? this.nodeDeployments : [];

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(project => this._userService.currentUserGroup(project.id)))
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));

    if (this.cluster.spec.cloud.aws) {
      this.displayedColumns = ['status', 'name', 'replicas', 'ver', 'availabilityZone', 'os', 'created', 'actions'];
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<NodeDeploymentEntity> {
    this.dataSource.data = this.nodeDeployments ? this.nodeDeployments : [];
    return this.dataSource;
  }

  getHealthStatus(nd: NodeDeploymentEntity): NodeDeploymentHealthStatus {
    return NodeDeploymentHealthStatus.getHealthStatus(nd);
  }

  getOperatingSystem(nd: NodeDeploymentEntity): string {
    return NodeUtils.getOperatingSystem(nd.spec.template);
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  goToDetails(nd: NodeDeploymentEntity): void {
    this._router.navigate(
        ['/projects/' + this.projectID + '/dc/' + this.datacenter.metadata.name + '/clusters/' + this.cluster.id +
         /nd/ + nd.id]);
  }

  isEditEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.nodeDeployments.edit;
  }

  showEditDialog(nd: NodeDeploymentEntity, event: Event): void {
    event.stopPropagation();
    this._nodeService
        .showNodeDeploymentEditDialog(nd, this.cluster, this.projectID, this.datacenter, this.changeNodeDeployment)
        .subscribe(() => {});
  }

  isDeleteEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.nodeDeployments.delete;
  }

  showDeleteDialog(nd: NodeDeploymentEntity, event: Event): void {
    event.stopPropagation();
    this._nodeService
        .showNodeDeploymentDeleteDialog(
            nd, this.cluster.id, this.projectID, this.datacenter.metadata.name, this.changeNodeDeployment)
        .subscribe(() => {});
  }
}
