import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';

import {ProjectService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';
import {NodeDeploymentHealthStatus} from '../../../shared/utils/health-status/node-deployment-health-status';
import {NodeService} from '../../services/node.service';

@Component({
  selector: 'kubermatic-node-deployment-list',
  templateUrl: 'node-deployment-list.component.html',
  styleUrls: ['node-deployment-list.component.scss'],
})
export class NodeDeploymentListComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() nodeDeployments: NodeDeploymentEntity[] = [];
  @Input() projectID: string;
  @Input() clusterHealthStatus: ClusterHealthStatus;
  @Input() isClusterRunning: boolean;
  @Input() isNodeDeploymentLoadFinished: boolean;
  @Output() changeNodeDeployment = new EventEmitter<NodeDeploymentEntity>();
  displayedColumns: string[] = ['status', 'name', 'replicas', 'ver', 'created', 'actions'];

  constructor(
      private readonly _router: Router, private readonly _nodeService: NodeService,
      private readonly _projectService: ProjectService) {}

  getDataSource(): MatTableDataSource<NodeDeploymentEntity> {
    const dataSource = new MatTableDataSource<NodeDeploymentEntity>();
    dataSource.data = this.nodeDeployments;
    return dataSource;
  }

  getHealthStatus(nd: NodeDeploymentEntity): NodeDeploymentHealthStatus {
    return NodeDeploymentHealthStatus.getHealthStatus(nd);
  }

  goToDetails(nd: NodeDeploymentEntity) {
    this._router.navigate(
        ['/projects/' + this.projectID + '/dc/' + this.datacenter.metadata.name + '/clusters/' + this.cluster.id +
         /nd/ + nd.id]);
  }

  isEditEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].nodeDeployments.edit;
  }

  showEditDialog(nd: NodeDeploymentEntity, event: Event): void {
    event.stopPropagation();
    this._nodeService
        .showNodeDeploymentEditDialog(nd, this.cluster, this.projectID, this.datacenter, this.changeNodeDeployment)
        .subscribe(() => {});
  }

  isDeleteEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].nodeDeployments.delete;
  }

  showDeleteDialog(nd: NodeDeploymentEntity, event: Event): void {
    event.stopPropagation();
    this._nodeService
        .showNodeDeploymentDeleteDialog(
            nd, this.cluster.id, this.projectID, this.datacenter.metadata.name, this.changeNodeDeployment)
        .subscribe(() => {});
  }
}
