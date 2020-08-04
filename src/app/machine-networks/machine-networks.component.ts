// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../core/services';
import {Cluster} from '../shared/entity/cluster';

@Component({
  selector: 'km-machine-networks',
  templateUrl: 'machine-networks.component.html',
  styleUrls: ['machine-networks.component.scss'],
})
export class MachineNetworksComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() width: number;
  @Input() isWizard: boolean;

  machineNetworksForm: FormGroup;
  machineNetworks: FormArray;

  private readonly _debounceTime = 1000;
  private _unsubscribe = new Subject<void>();

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    const machineNetworksList = new FormArray([]);

    if (this.isWizard) {
      for (const i in this.cluster.spec.machineNetworks) {
        if (Object.prototype.hasOwnProperty.call(this.cluster.spec.machineNetworks, i)) {
          machineNetworksList.push(
            new FormGroup({
              cidr: new FormControl(this.cluster.spec.machineNetworks[i].cidr, [
                Validators.required,
                Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/),
              ]),
              dnsServers: new FormControl(this.cluster.spec.machineNetworks[i].dnsServers, [
                Validators.required,
                Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*,*\s*)+)$/),
              ]),
              gateway: new FormControl(this.cluster.spec.machineNetworks[i].gateway, [
                Validators.required,
                Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/),
              ]),
            })
          );
        }
      }
    }

    if (_.isEmpty(machineNetworksList)) {
      machineNetworksList.push(
        new FormGroup({
          cidr: new FormControl('', [
            Validators.required,
            Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/),
          ]),
          dnsServers: new FormControl(
            [],
            [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*,*\s*)+)$/)]
          ),
          gateway: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)]),
        })
      );
    }

    this.machineNetworksForm = new FormGroup({
      machineNetworks: machineNetworksList,
    });

    this.machineNetworksForm.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
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
    this.machineNetworks.push(
      new FormGroup({
        cidr: new FormControl('', [
          Validators.required,
          Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/),
        ]),
        dnsServers: new FormControl(
          [],
          [Validators.required, Validators.pattern(/^((((\d{1,3}\.){3}\d{1,3})\s*,*\s*)+)$/)]
        ),
        gateway: new FormControl('', [Validators.required, Validators.pattern(/^((\d{1,3}\.){3}\d{1,3})$/)]),
      })
    );
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
      if (Object.prototype.hasOwnProperty.call(machineNetworks.controls, i)) {
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
