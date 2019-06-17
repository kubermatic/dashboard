import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ClusterService, WizardService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {MachineNetworkForm} from '../../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-add-machine-network',
  templateUrl: './add-machine-network.component.html',
})

export class AddMachineNetworkComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  machineNetworkFormData: MachineNetworkForm[] = [];
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _clusterService: ClusterService, private readonly _wizardService: WizardService,
      private readonly _dialogRef: MatDialogRef<AddMachineNetworkComponent>) {}

  ngOnInit(): void {
    this._wizardService.machineNetworksFormChanges$.pipe(takeUntil(this._unsubscribe))
        .subscribe((res: MachineNetworkForm[]) => {
          this.machineNetworkFormData = res;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
        if (this.machineNetworkFormData[i].cidr === '' || this.machineNetworkFormData[i].dnsServers.length === 0 ||
            this.machineNetworkFormData[i].gateway === '') {
          return;
        } else {
          this.cluster.spec.machineNetworks.push({
            cidr: this.machineNetworkFormData[i].cidr,
            dnsServers: this.machineNetworkFormData[i].dnsServers,
            gateway: this.machineNetworkFormData[i].gateway,
          });
        }
      }
    }
    this._clusterService.cluster(this.projectID, this.cluster.id, this.datacenter.metadata.name).subscribe((res) => {
      NotificationActions.success(`Machine Network(s) for ${this.cluster.name} successfully added`);
      this._dialogRef.close(res);
    });
  }
}
