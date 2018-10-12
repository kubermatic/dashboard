import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService, WizardService } from '../../../../core/services';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';
import { ClusterEntity, MachineNetwork } from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-add-machine-network',
  templateUrl: './add-machine-network.component.html',
  styleUrls: ['./add-machine-network.component.scss']
})

export class AddMachineNetworkComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  public machineNetworkData: MachineNetwork[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private wizardService: WizardService,
              private dialogRef: MatDialogRef<AddMachineNetworkComponent>) {}

  ngOnInit() {
    this.subscriptions.push(this.wizardService.machineNetworksFormChanges$.subscribe(res => {
      this.machineNetworkData = res;
    }));
  }

  isValid(): boolean {
    if (this.machineNetworkData.length > 0) {
      let valid = false;
      for (const i in this.machineNetworkData) {
        if (this.machineNetworkData[i].cidr === '' ||
            this.machineNetworkData[i].dnsServers.length === 0 ||
            this.machineNetworkData[i].gateway === '') {
          valid = false;
        } else {
          valid = true;
        }
      }
      return valid;
    } else {
      return false;
    }
  }

  addMachineNetworks(): void {
    if (this.machineNetworkData.length > 0) {
      for (const i in this.machineNetworkData) {
        if (this.machineNetworkData[i].cidr === '' ||
            this.machineNetworkData[i].dnsServers.length === 0 ||
            this.machineNetworkData[i].gateway === '') {
          return;
        } else {
          this.cluster.spec.machineNetworks.push(this.machineNetworkData[i]);
        }
      }
    }
    this.api.editCluster(this.cluster, this.datacenter.metadata.name, this.projectID).subscribe(res => {
      NotificationActions.success('Success', `Machine Network(s) successfully added`);
      this.dialogRef.close(res);
    });
  }

}
