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
import {MatDialogRef} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ClusterService, NotificationService, WizardService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';
import {MachineNetworkForm} from '../../../shared/model/ClusterForm';

@Component({
  selector: 'km-add-machine-network',
  templateUrl: './add-machine-network.component.html',
})
export class AddMachineNetworkComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  machineNetworkFormData: MachineNetworkForm[] = [];
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _wizardService: WizardService,
    private readonly _dialogRef: MatDialogRef<AddMachineNetworkComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._wizardService.machineNetworksFormChanges$
      .pipe(takeUntil(this._unsubscribe))
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
        if (
          this.machineNetworkFormData[i].cidr === '' ||
          this.machineNetworkFormData[i].dnsServers.length === 0 ||
          this.machineNetworkFormData[i].gateway === ''
        ) {
          return;
        }
        this.cluster.spec.machineNetworks.push({
          cidr: this.machineNetworkFormData[i].cidr,
          dnsServers: this.machineNetworkFormData[i].dnsServers,
          gateway: this.machineNetworkFormData[i].gateway,
        });
      }
    }
    this._clusterService.cluster(this.projectID, this.cluster.id).subscribe(res => {
      this._notificationService.success(
        `The machine network(s) for the <strong>${this.cluster.name}</strong> cluster were added`
      );
      this._dialogRef.close(res);
    });
  }
}
