import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog, MatDialogConfig, MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
import {NodeDataModalComponent} from '../node-data-modal/node-data-modal.component';

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
  @Output() changeNodeDeployment = new EventEmitter<NodeDeploymentEntity>();

  displayedColumns: string[] = ['status', 'name', 'replicas', 'ver', 'created', 'actions'];
  userGroupConfig: UserGroupConfig;
  userGroup: string;

  constructor(
      public dialog: MatDialog, private appConfigService: AppConfigService, private userService: UserService,
      private readonly api: ApiService, private readonly googleAnalyticsService: GoogleAnalyticsService,
      private router: Router) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).toPromise().then((group) => {
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
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Deleting', 'km-status-deleting');
    } else if (!nd.status) {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Pending', 'km-status-waiting');
    } else if (nd.status.availableReplicas === nd.spec.replicas) {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(green, 'Running', 'km-status-running');
    } else if (nd.status.availableReplicas > nd.spec.replicas) {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Updating', 'km-status-waiting');
    } else {
      healthStatus = NodeDeploymentListComponent.getHealthStatus_(orange, 'Pending', 'km-status-waiting');
    }

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
    const modal = this.dialog.open(NodeDataModalComponent, {
      data: {
        cluster: this.cluster,
        datacenter: this.datacenter,
        projectID: this.projectID,
        existingNodesCount: nd.spec.replicas,
        editMode: true,
        nodeDeployment: nd,
        nodeData: {
          count: nd.spec.replicas,
          spec: JSON.parse(JSON.stringify(nd.spec.template)),  // Deep copy method from MDN.
          valid: true,
        },
      }
    });

    modal.componentInstance.editNodeDeployment.toPromise().then((nd) => {
      this.changeNodeDeployment.emit(nd);
    });
  }

  showDeleteDialog(nd: NodeDeploymentEntity, event: Event): void {
    event.stopPropagation();
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

    dialogRef.afterClosed().toPromise().then((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteNodeDeployment(this.cluster.id, nd, this.datacenter.metadata.name, this.projectID)
            .subscribe(() => {
              NotificationActions.success('Success', 'Node Deployment removed successfully');
              this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeploymentDeleted');
              this.changeNodeDeployment.emit(nd);
            });
      }
    });
  }
}
