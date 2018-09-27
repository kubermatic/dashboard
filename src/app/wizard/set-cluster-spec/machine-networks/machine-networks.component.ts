import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatChipInputEvent, MatChip } from '@angular/material';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ApiService, WizardService } from '../../../core/services';

@Component({
  selector: 'kubermatic-machine-networks',
  templateUrl: 'machine-networks.component.html',
  styleUrls: ['machine-networks.component.scss']
})
export class MachineNetworksComponent implements OnInit, OnDestroy {
  @Input() cluster: any;
  public machineNetworksForm: FormGroup;
  public machineNetworksList: FormArray;
  public machineNetworks: FormArray;
  public dnsServers: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
  public invalidDnsServer = false;
  private subscriptions: Subscription[] = [];
  @ViewChild('chipList') chipList;
  _ref: any;

  constructor(private api: ApiService,
              private wizardService: WizardService) { }

  ngOnInit() {
    const machineNetworksList = new FormArray([]);
    for (const i in this.cluster.spec.machineNetworks) {
      if (this.cluster.spec.machineNetworks.hasOwnProperty(i)) {
        machineNetworksList.push(new FormGroup({
          cidr: new FormControl('', [Validators.required, Validators.pattern(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\/\d{1,2})$/)]),
          dnsServers: new FormControl([], [Validators.required]),
          gateway: new FormControl('', [Validators.required, Validators.pattern(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3})$/)])
        }));
      }
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

  hasDnsServerError(i): boolean {
    const group = this.machineNetworksForm as FormGroup;
    const array = group.controls['machineNetworks'] as FormArray;
    const controlGroup = group.controls[i] as FormGroup;

    if (!!this.chipList) {
      if (controlGroup.controls.dnsServers.hasError('required') && controlGroup.controls.gateway.touched && controlGroup.controls.cidr.touched) {
        this.chipList.errorState = true;
        return true;
      } else {
        this.chipList.errorState = false;
        return false;
      }
    } else {
      return false;
    }
  }

  getMachineNetworksForm(form) {
    return form.get('machineNetworks').controls;
  }

  addMachineNetwork() {
    this.machineNetworks = <FormArray>this.machineNetworksForm.get('machineNetworks');
    this.machineNetworks.push(new FormGroup({
      cidr: new FormControl('', [Validators.required, Validators.pattern(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\/\d{1,2})$/)]),
      dnsServers: new FormControl([], [Validators.required]),
      gateway: new FormControl('', [Validators.required, Validators.pattern(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3})$/)])
    }));
  }

  deleteMachineNetwork(index: number): void {
    const arrayControl = <FormArray>this.machineNetworksForm.get('machineNetworks');
    arrayControl.removeAt(index);
    this.setMachineNetworkSpec();
  }

  addDnsServer(event: MatChipInputEvent, index: number): void {
    const input = event.input;
    const value = event.value;
    if ((value.trim()).match(/^(\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3}\.{1}\d{1,3})$/) === null) {
      this.chipList.errorState = true;
      this.invalidDnsServer = true;
      return;
    }

    // Add DNS Server
    if ((value || '').trim()) {
      this.machineNetworksForm.controls.machineNetworks.value[index].dnsServers.push(value.trim());
      this.setMachineNetworkSpec();
    }
    // Reset the input value
    if (input) {
      input.value = '';
      this.chipList.errorState = false;
      this.invalidDnsServer = false;
    }
  }

  removeDnsServer(dnsServer: string, i: number): void {
    const dnsServerArray = this.machineNetworksForm.controls.machineNetworks.value[i].dnsServers;
    const index = dnsServerArray.indexOf(dnsServer);

    if (index >= 0) {
      this.machineNetworksForm.controls.machineNetworks.value[i].dnsServers.splice(index, 1);
      this.setMachineNetworkSpec();
    }
  }

  setMachineNetworkSpec() {
    const machineNetworksMap = [];
    for (const i in this.machineNetworksForm.controls.machineNetworks.value) {
      if (this.machineNetworksForm.controls.machineNetworks.value[i].cidr !== '' &&
        this.machineNetworksForm.controls.machineNetworks.value[i].dnsServers !== '' &&
        this.machineNetworksForm.controls.machineNetworks.value[i].gateway !== '') {
        machineNetworksMap.push(this.machineNetworksForm.controls.machineNetworks.value[i]);
      }
    }

    this.wizardService.changeMachineNetwork(machineNetworksMap);
  }

}
