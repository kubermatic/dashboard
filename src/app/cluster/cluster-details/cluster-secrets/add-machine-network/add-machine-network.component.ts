import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService, WizardService } from '../../../../core/services';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';
import { ClusterEntity, MachineNetwork } from '../../../../shared/entity/ClusterEntity';
import { MachineNetworkForm } from '../../../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-add-machine-network',
  templateUrl: './add-machine-network.component.html',
  styleUrls: ['./add-machine-network.component.scss']
})

export class AddMachineNetworkComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  public machineNetworkFormData: MachineNetworkForm[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private wizardService: WizardService,
              private dialogRef: MatDialogRef<AddMachineNetworkComponent>) {}

  ngOnInit(): void {
    this.subscriptions.push(this.wizardService.machineNetworksFormChanges$.subscribe(res => {
      this.machineNetworkFormData = res;
    }));
  }

  isValid(): boolean {
    let isValid = false;
    if (this.machineNetworkFormData.length > 0) {
      for (const i in this.machineNetworkFormData) {
        if (i === '0') {
          isValid = this.machineNetworkFormData[i].valid;
        } else {
          isValid = isValid && this.machineNetworkFormData[i].valid;
        }
      }
    }
    return isValid;
  }

  addMachineNetworks(): void {
    if (this.machineNetworkFormData.length > 0) {
      for (const i in this.machineNetworkFormData) {
        if (this.machineNetworkFormData[i].cidr === '' ||
            this.machineNetworkFormData[i].dnsServers.length === 0 ||
            this.machineNetworkFormData[i].gateway === '') {
          return;
        } else {
          this.cluster.spec.machineNetworks.push({
            cidr: this.machineNetworkFormData[i].cidr,
            dnsServers: this.machineNetworkFormData[i].dnsServers,
            gateway: this.machineNetworkFormData[i].gateway
          });
        }
      }
    }
    this.api.getCluster(this.cluster.id, this.datacenter.metadata.name, this.projectID).subscribe(res => {
      NotificationActions.success('Success', `Machine Network(s) successfully added`);
      this.dialogRef.close(res);
    });
  }

}
