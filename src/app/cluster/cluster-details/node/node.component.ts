import { Component, Input} from '@angular/core';
import { NodeEntityV2 } from 'app/shared/entity/NodeEntity';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material';
import { NodeDeleteConfirmationComponent } from '../node-delete-confirmation/node-delete-confirmation.component';
import { NotificationActions } from '../../../redux/actions/notification.actions';

@Component({
  selector: 'kubermatic-node',
  templateUrl: 'node.component.html',
  styleUrls: ['node.component.scss']
})

export class NodeComponent {
  @Input() nodes: NodeEntityV2[];
  @Input() clusterName: string;
  @Input() seedDcName: string;
  @Input() nodeProvider: string;
  @Input() index: number;
  @Input() clusterRunning: boolean;
  public conditionsMessage: string = '';
  public nodeRemoval: boolean = false;
  // public dialogRef: MatDialogRef<NodeDeleteConfirmationComponent>;

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

  constructor(public dialog: MatDialog) {}

  public managedByProvider (node: NodeEntityV2 ): boolean {
    if (!!node.status.nodeInfo.kubeletVersion) {
      return true;
    } else {
      return false;
    }
  }

  public onNodeRemoval(nodeRemoval: boolean): void {
    this.nodeRemoval = nodeRemoval;
  }

  public deleteNodeDialog(node): void {
    const dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, this.config);
    dialogRef.componentInstance.nodeName = node.metadata.name;
    dialogRef.componentInstance.clusterName = this.clusterName;
    dialogRef.componentInstance.seedDcName = this.seedDcName;
    dialogRef.componentInstance.onNodeRemoval = this.onNodeRemoval.bind(this);

    dialogRef.afterClosed().subscribe(result => {
      // this.dialogRef = null;
    });
  }

  public getNodeHealth(node): string {
    const green = 'fa fa-circle green';
    const red = 'fa fa-circle-o red';
    const orange = 'fa fa-spin fa-circle-o-notch orange';
    const orangeSpinner = 'fa fa-spin fa-circle-o-notch orange';

    if (!!node.status.nodeInfo.kubeletVersion) {
      if (!!node.status.ErrorMessage) {
        NotificationActions.error('Error', node.status.ErrorMessage);
        return red;
      } else {
        return green;
      }
    } else {
      return orangeSpinner;
    }
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

  public getNodeState(state: string): boolean {
    return state === 'running';
  }

  public getAddresses(node: NodeEntityV2): object {
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
}
