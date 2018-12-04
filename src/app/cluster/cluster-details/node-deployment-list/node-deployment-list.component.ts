import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog, MatTableDataSource} from '@angular/material';

import {AppConfigService} from '../../../app-config.service';
import {UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {UserGroupConfig} from '../../../shared/model/Config';

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
  @Output() deleteNodeDeployment = new EventEmitter<NodeDeploymentEntity>();

  displayedColumns: string[] = ['position', 'name', 'replicas', 'ver', 'created', 'status'];
  userGroupConfig: UserGroupConfig;
  userGroup: string;

  constructor(public dialog: MatDialog, private appConfigService: AppConfigService, private userService: UserService) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).subscribe((group) => {
      this.userGroup = group;
    });
  }

  getDataSource(): MatTableDataSource<NodeDeploymentEntity> {
    const dataSource = new MatTableDataSource<NodeDeploymentEntity>();
    dataSource.data = this.nodeDeployments;
    return dataSource;
  }

  getHealthStatus(nd: NodeDeploymentEntity, index: number): object {
    const green = 'fa fa-circle green';
    const orangeSpinner = 'fa fa-spin fa-circle-o-notch orange';
    const healthStatus = {};

    if (!!nd.deletionTimestamp) {
      healthStatus['color'] = orangeSpinner;
      healthStatus['status'] = 'Deleting';
      healthStatus['class'] = 'statusDeleting';
    } else if (nd.status.availableReplicas === nd.spec.replicas) {
      healthStatus['color'] = green;
      healthStatus['status'] = 'Running';
      healthStatus['class'] = 'statusRunning';
    } else if (nd.status.availableReplicas > nd.spec.replicas) {
      healthStatus['color'] = orangeSpinner;
      healthStatus['status'] = 'Updating';
      healthStatus['class'] = 'statusWaiting';
    } else {
      healthStatus['color'] = orangeSpinner;
      healthStatus['status'] = 'Pending';
      healthStatus['class'] = 'statusWaiting';
    }

    if (index % 2 !== 0) {
      healthStatus['class'] += ' odd';
    }

    return healthStatus;
  }
}
