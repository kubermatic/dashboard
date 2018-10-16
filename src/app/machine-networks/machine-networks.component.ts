import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ApiService, WizardService } from '../core/services';

@Component({
  selector: 'kubermatic-machine-networks',
  templateUrl: 'machine-networks.component.html',
  styleUrls: ['machine-networks.component.scss']
})
export class MachineNetworksComponent implements OnInit, OnDestroy {
  @Input() cluster: any;
  @Input() width: number;
  @Input() isWizard: boolean;
  public machineNetworksForm: FormGroup;
  public machineNetworksList: FormArray;
  public machineNetworks: FormArray;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private wizardService: WizardService) { }

  ngOnInit() {
    const machineNetworksList = new FormArray([]);

    if (!!this.isWizard) {
      for (const i in this.cluster.spec.machineNetworks) {
        if (this.cluster.spec.machineNetworks.hasOwnProperty(i)) {
          machineNetworksList.push(new FormGroup({
            cidr: new FormControl(this.cluster.spec.machineNetworks[i].cidr, [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/)]),
            dnsServers: new FormControl(this.cluster.spec.machineNetworks[i].dnsServers, [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*\,*\s*)+)$/)]),
            gateway: new FormControl(this.cluster.spec.machineNetworks[i].gateway, [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)])
          }));
        }
      }
    } else {
      machineNetworksList.push(new FormGroup({
        cidr: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/)]),
        dnsServers: new FormControl([], [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*\,*\s*)+)$/)]),
        gateway: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)])
      }));
    }

    this.machineNetworksForm = new FormGroup({
      machineNetworks: machineNetworksList
    });

    this.subscriptions.push(this.machineNetworksForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
      this.setMachineNetworkSpec();
    }));
  }

  public ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getMachineNetworksForm(form) {
    return form.get('machineNetworks').controls;
  }

  addMachineNetwork() {
    this.machineNetworks = <FormArray>this.machineNetworksForm.get('machineNetworks');
    this.machineNetworks.push(new FormGroup({
      cidr: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/)]),
      dnsServers: new FormControl([], [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*\,*\s*)+)$/)]),
      gateway: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)])
    }));
  }

  deleteMachineNetwork(index: number): void {
    const arrayControl = <FormArray>this.machineNetworksForm.get('machineNetworks');
    arrayControl.removeAt(index);
    this.setMachineNetworkSpec();
  }

  setMachineNetworkSpec() {
    const machineNetworksMap = [];
    for (const i in this.machineNetworksForm.controls.machineNetworks.value) {
      if (this.machineNetworksForm.controls.machineNetworks.value[i].cidr !== '' &&
        this.machineNetworksForm.controls.machineNetworks.value[i].dnsServers !== '' &&
        this.machineNetworksForm.controls.machineNetworks.value[i].gateway !== '') {
        machineNetworksMap.push({
          cidr: this.machineNetworksForm.controls.machineNetworks.value[i].cidr,
          gateway: this.machineNetworksForm.controls.machineNetworks.value[i].gateway,
          dnsServers: this.machineNetworksForm.controls.machineNetworks.value[i].dnsServers.replace(/\s/g,'').split(','),
          valid: this.machineNetworksForm.controls.machineNetworks.controls[i].valid
        });
      }
    }

    this.wizardService.changeMachineNetwork(machineNetworksMap);
  }

}
