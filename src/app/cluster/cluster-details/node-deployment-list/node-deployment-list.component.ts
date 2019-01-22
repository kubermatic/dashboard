import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';
import {first} from 'rxjs/operators';

import {AppConfigService} from '../../../app-config.service';
import {UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
import {NodeService} from '../../services/node.service';

@Component({
  selector: 'kubermatic-node-deployment-list',
  templateUrl: 'node-deployment-list.component.html',
  styleUrls: ['node-deployment-list.component.scss'],
})
export class NodeDeploymentListComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() nodeDeployments: NodeDeploymentEntity[] = [];
  @Input() projectID: string;
  @Input() clusterHealthStatus: string;
  @Input() isClusterRunning: boolean;
  @Input() hasInitialNodes: boolean;
  @Output() changeNodeDeployment = new EventEmitter<NodeDeploymentEntity>();

  displayedColumns: string[] = ['status', 'name', 'replicas', 'ver', 'created', 'actions'];
  userGroupConfig: UserGroupConfig;
  userGroup: string;

  constructor(
      private appConfigService: AppConfigService, private userService: UserService, private router: Router,
      private readonly _nodeService: NodeService) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).pipe(first()).subscribe((group) => {
      this.userGroup = group;
    });
  }

  getDataSource(): MatTableDataSource<NodeDeploymentEntity> {
    const dataSource = new MatTableDataSource<NodeDeploymentEntity>();
    dataSource.data = this.nodeDeployments;
    return dataSource;
  }

  getHealthStatus(nd: NodeDeploymentEntity, index: number): object {
    const healthStatus = this._nodeService.getHealthStatus(nd);
    if (index % 2 !== 0) {
      healthStatus['class'] += ' km-odd';
    }

    return healthStatus;
  }

  goToDetails(nd: NodeDeploymentEntity) {
    this.router.navigate(
        ['/projects/' + this.projectID + '/dc/' + this.datacenter.metadata.name + '/clusters/' + this.cluster.id +
         /nd/ + nd.id]);
  }

  showEditDialog(nd: NodeDeploymentEntity, event: Event): void {
    event.stopPropagation();
    this._nodeService.showNodeDeploymentEditDialog(
        nd, this.cluster, this.projectID, this.datacenter, this.changeNodeDeployment);
  }

  showDeleteDialog(nd: NodeDeploymentEntity, event: Event): void {
    event.stopPropagation();
    this._nodeService.showNodeDeploymentDeleteDialog(
        nd, this.cluster.id, this.projectID, this.datacenter.metadata.name, this.changeNodeDeployment);
  }
}
