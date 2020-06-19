import {Component, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';

import {Cluster, MachineNetwork} from '../../../shared/entity/cluster';
import {Datacenter} from '../../../shared/entity/datacenter';

import {AddMachineNetworkComponent} from '../add-machine-network/add-machine-network.component';

@Component({
  selector: 'km-machine-networks-display',
  templateUrl: './machine-networks-display.component.html',
  styleUrls: ['./machine-networks-display.component.scss'],
})
export class MachineNetworksDisplayComponent {
  @Input() cluster: Cluster;
  @Input() datacenter: Datacenter;
  @Input() projectID: string;

  displayedColumns: string[] = ['number', 'cidr', 'dnsServers', 'gateway'];
  dataSource = new MatTableDataSource<MachineNetwork>();

  constructor(public dialog: MatDialog) {}

  getDataSource(): MatTableDataSource<MachineNetwork> {
    this.dataSource.data = this.cluster.spec.machineNetworks;
    return this.dataSource;
  }

  getDnsString(element: MachineNetwork): string {
    return element.dnsServers.join(', ');
  }

  addMachineNetwork(): void {
    const dialogRef = this.dialog.open(AddMachineNetworkComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }
}
