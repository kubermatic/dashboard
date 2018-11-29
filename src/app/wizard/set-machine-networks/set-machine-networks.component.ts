import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {WizardService} from '../../core/services';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {MachineNetworkForm} from '../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-set-machine-networks',
  templateUrl: 'set-machine-networks.component.html',
  styleUrls: ['set-machine-networks.component.scss'],
})

export class SetMachineNetworksComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  setMachineNetworkForm: FormGroup;
  machineNetworkFormData: MachineNetworkForm[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    this.setMachineNetworkForm = new FormGroup({
      checkMachineNetworks: new FormControl(false),
    });

    if (!!this.cluster.spec.machineNetworks && this.cluster.spec.machineNetworks.length > 0) {
      this.setMachineNetworkForm.controls.checkMachineNetworks.setValue(true);
    }

    this.subscriptions.push(this.setMachineNetworkForm.valueChanges.pipe(debounceTime(1000)).subscribe(() => {
      this.setMachineNetworks();
    }));

    this.subscriptions.push(this.wizardService.machineNetworksFormChanges$.subscribe((res: MachineNetworkForm[]) => {
      this.machineNetworkFormData = res;
      this.setMachineNetworks();
    }));
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  setMachineNetworks(): void {
    let isValid = false;
    if (!!this.setMachineNetworkForm.controls.checkMachineNetworks.value) {
      if (this.machineNetworkFormData.length > 0) {
        for (const i in this.machineNetworkFormData) {
          if (i === '0') {
            isValid = this.machineNetworkFormData[i].valid;
          } else {
            isValid = isValid && this.machineNetworkFormData[i].valid;
          }
        }
      } else {
        isValid = false;
      }
    }

    this.wizardService.changeSetMachineNetworks({
      setMachineNetworks: this.setMachineNetworkForm.controls.checkMachineNetworks.value,
      machineNetworks: this.machineNetworkFormData,
      valid: isValid,
    });
  }
}
