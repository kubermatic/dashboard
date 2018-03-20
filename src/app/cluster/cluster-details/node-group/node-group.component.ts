import { Component, OnInit, Input } from '@angular/core';
import { NodeEntityV2 } from '../../../shared/entity/NodeEntity';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material';
import { NodeDeleteConfirmationComponent } from '../node-delete-confirmation/node-delete-confirmation.component';

@Component({
  selector: 'kubermatic-node-group',
  templateUrl: 'node-group.component.html',
  styleUrls: ['node-group.component.scss']
})

export class NodeGroupComponent implements OnInit {
  @Input() nodes: NodeEntityV2[];
  @Input() clusterName: string;
  @Input() datacenter: string;
  @Input() nodeProvider: string;
  public conditionsMessage: string = '';
  public nodeRemoval: boolean = false;
  public node: NodeEntityV2;
  // public dialogRef: MatDialogRef<NodeDeleteConfirmationComponent>;
  public stateOfTheAccordion: any = [];

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

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  getAccordionState(group) {
    return !!this.stateOfTheAccordion[group] ? true : false;
  }

  onNodeGroupToggle(expanded, group) {
    this.stateOfTheAccordion[group] = expanded;
  }


  public deleteNodeDialog(node): void {
    const dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, this.config);
    dialogRef.componentInstance.node = node;
    dialogRef.componentInstance.clusterName = this.clusterName;
    dialogRef.componentInstance.datacenter = this.datacenter;

    dialogRef.afterClosed().subscribe(result => {
      // this.dialogRef = null;
    });
  }

  public getNodeHealth(state, conditions) {
    const green = 'fa fa-circle green';
    const red = 'fa fa-circle-o red';
    const orange = 'fa fa-spin fa-circle-o-notch orange';
    const orangeSpinner = 'fa fa-spin fa-circle-o-notch orange';

    const kubeMachineState = state;

    if (conditions) {
      this.conditionsMessage = '';
      for (const entry of conditions) {
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

  public getNodeState(node: NodeEntityV2): boolean {
    return node.metadata.annotations['node.k8s.io/state'] === 'running' ? true : false;
  }
}


