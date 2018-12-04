import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog, MatDialogConfig, MatTableDataSource} from '@angular/material';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
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
  private static getHealthStatus_(color: string, status: string, className: string): object {
    return {
      color,
      status,
      class: className,
    };
  }

  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() nodeDeployments: NodeDeploymentEntity[] = [];
  @Input() projectID: string;
  @Input() clusterHealthStatus: string;
  @Input() isClusterRunning: boolean;
  @Input() hasInitialNodes: boolean;
  @Output() deleteNodeDeployment = new EventEmitter<NodeDeploymentEntity>();

  displayedColumns: string[] = ['position', 'name', 'replicas', 'ver', 'created', 'status', 'actions'];
  userGroupConfig: UserGroupConfig;
  userGroup: string;

  constructor(
      public dialog: MatDialog, private appConfigService: AppConfigService, private userService: UserService,
      private readonly api: ApiService, private readonly googleAnalyticsService: GoogleAnalyticsService) {}

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
    const orange = 'fa fa-spin fa-circle-o-notch orange';
    let healthStatus = {};

    if (!!nd.deletionTimestamp) {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Deleting', 'statusDeleting');
    } else if (!nd.status) {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Pending', 'statusWaiting');
    } else if (nd.status.availableReplicas === nd.spec.replicas) {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(green, 'Running', 'statusRunning');
    } else if (nd.status.availableReplicas > nd.spec.replicas) {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Updating', 'statusWaiting');
    } else {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Pending', 'statusWaiting');
    }

    if (index % 2 !== 0) {
      healthStatus['class'] += ' odd';
    }

    return healthStatus;
  }

  showDeleteDialog(nd: NodeDeploymentEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Node Deployment',
        message: `You are on the way to delete the ${nd.name} node deployment. It cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteClusterNodeDeployment(this.cluster.id, nd, this.datacenter.metadata.name, this.projectID)
            .subscribe(() => {
              NotificationActions.success('Success', 'Node removed successfully');
              this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeleted');
              this.deleteNodeDeployment.emit(nd);
            });
      }
    });
  }
}
