import {Component, Input} from '@angular/core';
import {MatDialog} from '@angular/material';

import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';

import {AddMachineNetworkComponent} from '../add-machine-network/add-machine-network.component';

@Component({
  selector: 'kubermatic-machine-networks-dispay',
  templateUrl: './machine-networks-dispay.component.html',
  styleUrls: ['./machine-networks-dispay.component.scss'],
})

export class MachineNetworksDisplayComponent {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  constructor(public dialog: MatDialog) {}

  addMachineNetwork(): void {
    const dialogRef = this.dialog.open(AddMachineNetworkComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }
}
