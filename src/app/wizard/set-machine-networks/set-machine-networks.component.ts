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
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../core/services';
import {Cluster} from '../../shared/entity/cluster';
import {MachineNetworkForm} from '../../shared/model/ClusterForm';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {getOperatingSystem} from '../../shared/entity/node';

@Component({
  selector: 'km-set-machine-networks',
  templateUrl: 'set-machine-networks.component.html',
  styleUrls: ['set-machine-networks.component.scss'],
})
export class SetMachineNetworksComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() nodeData: NodeData;
  setMachineNetworkForm: FormGroup;
  machineNetworkFormData: MachineNetworkForm[] = [];
  private _unsubscribe = new Subject<void>();

  constructor(private wizardService: WizardService) {}

  ngOnInit(): void {
    this.setMachineNetworkForm = new FormGroup({
      checkMachineNetworks: new FormControl(false),
    });

    if (!!this.cluster.spec.machineNetworks && this.cluster.spec.machineNetworks.length > 0) {
      this.setMachineNetworkForm.controls.checkMachineNetworks.setValue(true);
    }

    if (!this.nodeData.spec.operatingSystem.containerLinux) {
      this.setMachineNetworkForm.controls.checkMachineNetworks.disable();
    }

    this.setMachineNetworkForm.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.setMachineNetworks();
      });

    this.wizardService.machineNetworksFormChanges$
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((res: MachineNetworkForm[]) => {
        this.machineNetworkFormData = res;
        this.setMachineNetworks();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getOperatingSystem(): string {
    return getOperatingSystem(this.nodeData.spec);
  }

  setMachineNetworks(): void {
    let isValid = false;
    if (this.setMachineNetworkForm.controls.checkMachineNetworks.value) {
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
