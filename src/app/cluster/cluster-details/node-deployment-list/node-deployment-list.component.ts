import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { MatDialog, MatTableDataSource } from '@angular/material';
import {AppConfigService} from '../../../app-config.service';
import {UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
import { NodeDeploymentEntity } from '../../../shared/entity/NodeDeploymentEntity';

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

  displayedColumns: string[] = ['position', 'name', 'replicas', 'created'];
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

}
