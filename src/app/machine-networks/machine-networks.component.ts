import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../core/services';
import {ClusterEntity} from '../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-machine-networks',
  templateUrl: 'machine-networks.component.html',
  styleUrls: ['machine-networks.component.scss'],
})

export class MachineNetworksComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() width: number;
  @Input() isWizard: boolean;
  machineNetworksForm: FormGroup;
  machineNetworks: FormArray;
  private _unsubscribe = new Subject<void>();

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    const machineNetworksList = new FormArray([]);

    if (!!this.isWizard) {
      for (const i in this.cluster.spec.machineNetworks) {
        if (this.cluster.spec.machineNetworks.hasOwnProperty(i)) {
          machineNetworksList.push(new FormGroup({
            cidr: new FormControl(
                this.cluster.spec.machineNetworks[i].cidr,
                [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/)]),
            dnsServers: new FormControl(
                this.cluster.spec.machineNetworks[i].dnsServers,
                [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*\,*\s*)+)$/)]),
            gateway: new FormControl(
                this.cluster.spec.machineNetworks[i].gateway,
                [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)]),
          }));
        }
      }
    }

    if (machineNetworksList.length === 0) {
      machineNetworksList.push(new FormGroup({
        cidr: new FormControl(
            '', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/)]),
        dnsServers:
            new FormControl([], [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*\,*\s*)+)$/)]),
        gateway: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)]),
      }));
    }

    this.machineNetworksForm = new FormGroup({
      machineNetworks: machineNetworksList,
    });

    this.machineNetworksForm.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.setMachineNetworkSpec();
    });

    this.setMachineNetworkSpec();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getMachineNetworksForm(form): void {
    return form.get('machineNetworks').controls;
  }

  addMachineNetwork(): void {
    this.machineNetworks = this.machineNetworksForm.get('machineNetworks') as FormArray;
    this.machineNetworks.push(new FormGroup({
      cidr: new FormControl(
          '', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/)]),
      dnsServers:
          new FormControl([], [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*\,*\s*)+)$/)]),
      gateway: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)]),
    }));
  }

  deleteMachineNetwork(index: number): void {
    const arrayControl = this.machineNetworksForm.get('machineNetworks') as FormArray;
    arrayControl.removeAt(index);
    this.setMachineNetworkSpec();
  }

  setMachineNetworkSpec(): void {
    const machineNetworks = this.machineNetworksForm.get('machineNetworks') as FormArray;
    const machineNetworksMap = [];
    for (const i in machineNetworks.controls) {
      if (machineNetworks.controls.hasOwnProperty(i)) {
        machineNetworksMap.push({
          cidr: machineNetworks.value[i].cidr,
          gateway: machineNetworks.value[i].gateway,
          dnsServers: machineNetworks.value[i].dnsServers.toString().replace(/\s/g, '').split(','),
          valid: machineNetworks.controls[i].valid,
        });
      }
    }

    this.wizardService.changeMachineNetwork(machineNetworksMap);
  }
}
