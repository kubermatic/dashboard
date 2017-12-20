import { Component, OnInit, Input} from '@angular/core';
import { NodeEntity } from 'app/shared/entity/NodeEntity';
import {MatDialog, MatDialogRef, MatDialogConfig} from '@angular/material';
import {NodeDeleteConfirmationComponent} from '../node-delete-confirmation/node-delete-confirmation.component';

@Component({
  selector: 'kubermatic-node',
  templateUrl: 'node.component.html',
  styleUrls: ['node.component.scss']
})

export class NodeComponent implements OnInit {
  @Input() nodes: NodeEntity[];
  @Input() clusterName: string;
  @Input() seedDcName: string;
  @Input() nodeProvider: string;
  @Input() index: number;
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

  ngOnInit() {}

  public managedByProvider (node: NodeEntity ): boolean {
    return node.metadata.annotations['node.k8s.io/driver-data'];
  }

  onNodeRemoval(nodeRemoval: boolean) {
    this.nodeRemoval = nodeRemoval;
  }


  public deleteNodeDialog(node): void {
    const dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, this.config);
    dialogRef.componentInstance.nodeName = node.metadata.name;
    dialogRef.componentInstance.nodeUID = node.metadata.uid;
    dialogRef.componentInstance.clusterName = this.clusterName;
    dialogRef.componentInstance.seedDcName = this.seedDcName;
    dialogRef.componentInstance.onNodeRemoval = this.onNodeRemoval.bind(this);

    dialogRef.afterClosed().subscribe(result => {
      // this.dialogRef = null;
    });
  }

  public getNodeHealth(node) {
    const green = 'fa fa-circle green';
    const red = 'fa fa-circle-o red';
    const orange = 'fa fa-spin fa-circle-o-notch orange';
    const orangeSpinner = 'fa fa-spin fa-circle-o-notch orange';

    const kubeMachineState = node.metadata.annotations['node.k8s.io/state'];

    if (node.status.conditions) {
      this.conditionsMessage = '';
      for (const entry of node.status.conditions) {
        if (entry.status === 'True' && entry.type !== 'Ready') {
          this.conditionsMessage = this.conditionsMessage + entry.type + ': ' + entry.message + ' ';
        }
      }
    }

    if (this.conditionsMessage !== '' && kubeMachineState === 'running') {
      return red;
    }

    switch (kubeMachineState) {
      case 'pending':
        return orange;
      case 'provisioning':
        return orangeSpinner;
      case 'launching':
        return orangeSpinner;
      case 'running':
        return green;
      default:
        return red;
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
    return state === 'running' ? true : false;
  }
}





