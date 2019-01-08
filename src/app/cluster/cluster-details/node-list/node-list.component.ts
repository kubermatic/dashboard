import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
import {NodeDuplicateComponent} from '../node-duplicate/node-duplicate.component';

@Component({
  selector: 'kubermatic-node-list',
  templateUrl: 'node-list.component.html',
  styleUrls: ['node-list.component.scss'],
})

export class NodeListComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() nodes: NodeEntity[] = [];
  @Input() projectID: string;
  @Output() deleteNode = new EventEmitter<NodeEntity>();
  @Input() clusterHealthStatus: string;
  @Input() isClusterRunning: boolean;
  @Input() hasInitialNodes: boolean;
  isNodeDeploymentAPIAvailable = false;
  clickedDeleteNode = {};
  clickedDuplicateNode = {};
  isShowNodeDetails = {};
  userGroupConfig: UserGroupConfig;
  userGroup: string;
  config: MatDialogConfig = {
    disableClose: false,
    hasBackdrop: true,
  };

  constructor(
      public dialog: MatDialog, private appConfigService: AppConfigService, private userService: UserService,
      private readonly api: ApiService, private readonly googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.isNodeDeploymentAPIAvailable = this.api.isNodeDeploymentEnabled();
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).subscribe((group) => {
      this.userGroup = group;
    });
  }

  deleteNodeDialog(node: NodeEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Node',
        message: `You are on the way to delete the ${node.name} node. It cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    this.clickedDeleteNode[node.id] = true;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');


    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteClusterNode(this.cluster.id, node, this.datacenter.metadata.name, this.projectID)
            .subscribe(() => {
              NotificationActions.success('Success', 'Node removed successfully');
              this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeleted');
              this.deleteNode.emit(node);
            });
      }
    });
  }

  duplicateNodeDialog(node: NodeEntity): void {
    this.clickedDuplicateNode[node.id] = true;
    const dialogRef = this.dialog.open(NodeDuplicateComponent);
    dialogRef.componentInstance.node = node;
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
    const sub = dialogRef.afterClosed().subscribe(() => {
      this.clickedDuplicateNode[node.id] = false;
      sub.unsubscribe();
    });
  }

  getNodeHealthStatus(node: NodeEntity, index: number): object {
    const green = 'fa fa-circle green';
    const red = 'fa fa-circle-o red';
    const orangeSpinner = 'fa fa-spin fa-circle-o-notch orange';

    const nodeHealthStatus = {};

    if (!!node.status.errorMessage && !node.deletionTimestamp) {
      nodeHealthStatus['color'] = red;
      nodeHealthStatus['status'] = 'Failed';
      nodeHealthStatus['class'] = 'statusFailed';
    } else if (!!node.status.nodeInfo.kubeletVersion && !node.status.errorMessage && !node.deletionTimestamp) {
      nodeHealthStatus['color'] = green;
      nodeHealthStatus['status'] = 'Running';
      nodeHealthStatus['class'] = 'statusRunning';
    } else if (!!node.deletionTimestamp) {
      nodeHealthStatus['color'] = orangeSpinner;
      nodeHealthStatus['status'] = 'Deleting';
      nodeHealthStatus['class'] = 'statusDeleting';
    } else {
      nodeHealthStatus['color'] = orangeSpinner;
      nodeHealthStatus['status'] = 'Pending';
      nodeHealthStatus['class'] = 'statusWaiting';
    }

    if (index % 2 !== 0) {
      nodeHealthStatus['class'] += ' odd';
    }

    return nodeHealthStatus;
  }

  getFormattedNodeMemory(memory: string): string {
    const memRE = /([0-9]+)([a-zA-Z])i/;
    const nodeAllocatable = memory;

    const resRE = nodeAllocatable.match(memRE);

    let nodeCapacity;
    const prefixes = ['Ki', 'Mi', 'Gi', 'Ti'];
    let i = 0;

    if (resRE) {
      let ki = parseInt(resRE[1], 10);  // tslint:disable-line

      do {
        ki /= 1024;
        i++;
      } while (ki > 1);
      nodeCapacity = (ki * 1024).toFixed(2);
    }

    return nodeCapacity ? `${nodeCapacity} ${prefixes[i - 1]}` : 'unknown';
  }

  getAddresses(node: NodeEntity): object {
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

  getOsImage(node: NodeEntity): string {
    if (node.spec.operatingSystem.containerLinux) {
      return 'containerlinux';
    } else if (node.spec.operatingSystem.ubuntu) {
      return 'ubuntu';
    } else if (node.spec.operatingSystem.centos) {
      return 'centos';
    } else {
      return '';
    }
  }

  showInfo(node: NodeEntity): boolean {
    return node.name !== node.id.replace('machine-', '') && node.id !== '';
  }

  getInfo(node: NodeEntity): string {
    if (node.spec.cloud.aws) {
      return node.name;
    }
    return node.id.replace('machine-', '');
  }

  getNodeName(node: NodeEntity): string {
    return node.id.replace('machine-', '');
  }

  toggleNode(nodeID: string): void {
    const element = event.target as HTMLElement;
    const className = element.className;
    if (!this.clickedDeleteNode[nodeID] && !this.clickedDuplicateNode[nodeID] && className !== 'copy') {
      if (this.isShowNodeDetails[nodeID]) {
        this.isShowNodeDetails[nodeID] = false;
      } else if (!this.isShowNodeDetails[nodeID]) {
        this.isShowNodeDetails[nodeID] = true;
      }
    }
  }

  displayTags(tags: object): boolean {
    return Object.keys(tags).length > 0;
  }

  getTagsFromObject(tags: object): string {
    let tagsValue = '';
    let counter = 0;
    for (const i in tags) {
      if (tags.hasOwnProperty(i)) {
        counter++;
        if (counter === 1) {
          tagsValue += (i + ': ' + tags[i]);
        } else {
          tagsValue += (', ' + i + ': ' + tags[i]);
        }
      }
    }
    return tagsValue;
  }
}
