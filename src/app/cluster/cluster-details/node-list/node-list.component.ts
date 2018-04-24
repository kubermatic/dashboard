import {Component, EventEmitter, Input, Output, OnChanges} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { NodeDeleteConfirmationComponent } from '../node-delete-confirmation/node-delete-confirmation.component';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { ClusterService } from '../../../core/services';


@Component({
  selector: 'kubermatic-node-list',
  templateUrl: 'node-list.component.html',
  styleUrls: ['node-list.component.scss']
})

export class NodeListComponent implements OnChanges {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() nodes: NodeEntity[] = [];
  @Output() deleteNode = new EventEmitter<NodeEntity>();
  public isClusterRunning: boolean;
  public config: MatDialogConfig = {
    disableClose: false,
    hasBackdrop: true,
    backdropClass: '',
    width: '',
    height: '',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: ''
    },
    data: {
      message: 'Jazzy jazz jazz'
    }
  };

  constructor(public dialog: MatDialog,
              private clusterService: ClusterService) {
  }

  ngOnChanges() {
    this.isClusterRunning = this.clusterService.isClusterRunning(this.cluster);
  }

  public managedByProvider(node: NodeEntity): boolean {
    if (!!node.status.machineName) {
      return true;
    } else {
      return false;
    }
  }

  public deleteNodeDialog(node: NodeEntity): void {
    const dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, this.config);
    dialogRef.componentInstance.node = node;
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;

    dialogRef.afterClosed().subscribe(result => {
      this.deleteNode.emit(node);
    });
  }

  public getNodeHealth(node: NodeEntity): object {
    const green = 'fa fa-circle green';
    const red = 'fa fa-circle-o red';
    const orangeSpinner = 'fa fa-spin fa-circle-o-notch orange';

    const nodeHealthStatus = {};

    if (!!node.status.errorMessage && !node.metadata.deletionTimestamp) {
      nodeHealthStatus['color'] = red;
      nodeHealthStatus['status'] = 'Failed';
    } else if (!!node.status.nodeInfo.kubeletVersion && !node.status.errorMessage && !node.metadata.deletionTimestamp) {
      nodeHealthStatus['color'] = green;
      nodeHealthStatus['status'] = 'Running';
    } else if (!!node.metadata.deletionTimestamp) {
      nodeHealthStatus['color'] = orangeSpinner;
      nodeHealthStatus['status'] = 'Deleting';
    } else {
      nodeHealthStatus['color'] = orangeSpinner;
      nodeHealthStatus['status'] = 'Pending';
    }
    return nodeHealthStatus;
  }

  public getFormattedNodeMemory(memory: string): string {
    const memRE = /([0-9]+)([a-zA-Z])i/;
    const nodeAllocatable = memory;

    const resRE = nodeAllocatable.match(memRE);

    let nodeCapacity;
    const prefixes = ['Ki', 'Mi', 'Gi', 'Ti'];
    let i = 0;

    if (resRE) {
      let ki = parseInt(resRE[1], 10);

      do {
        ki /= 1024;
        i++;
      }
      while (ki > 1);
      nodeCapacity = (ki * 1024).toFixed(2);
    }

    return nodeCapacity ? `${nodeCapacity} ${prefixes[i - 1]}` : 'unknown';
  }

  public getAddresses(node: NodeEntity): object {
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

  public getTooltip(node: NodeEntity): string {
    if (node.spec.cloud.digitalocean) {
      return 'Backups: ' + node.spec.cloud.digitalocean.backups + ', IPv6: ' + node.spec.cloud.digitalocean.ipv6 + ', Monitoring: ' + node.spec.cloud.digitalocean.monitoring;
    } else {
      return '';
    }
  }

  public getOsImagePath(node: NodeEntity): string {
    let path = '/assets/images/operating-system/';

    if (node.spec.operatingSystem.containerLinux) {
      path += 'containerlinux.png';
    } else if (node.spec.operatingSystem.ubuntu) {
      path += 'ubuntu.png';
    } /*else if (node.spec.operatingSystem.centOS) {
      path += 'centos.png';
    }*/

    return path;
  }
}
