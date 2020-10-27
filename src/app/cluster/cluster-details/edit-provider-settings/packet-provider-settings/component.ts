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
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {ClusterService} from '@core/services/cluster/cluster.service';
import {AVAILABLE_PACKET_BILLING_CYCLES, Cluster, ProviderSettingsPatch} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-packet-provider-settings',
  templateUrl: './template.html',
})
export class PacketProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;

  form: FormGroup;

  private readonly _billingCycleMaxLen = 64;
  private readonly _apiKeyMaxLen = 64;
  private readonly _projectIDMaxLen = 64;
  private readonly _debounceTime = 1000;
  private _formData = {apiKey: '', projectID: '', billingCycle: ''};
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private clusterService: ClusterService) {}

  get apiKey(): AbstractControl {
    return this.form.controls.apiKey;
  }

  get projectID(): AbstractControl {
    return this.form.controls.projectID;
  }

  ngOnInit(): void {
    let billingCycle = this.cluster.spec.cloud.packet.billingCycle;
    if (!billingCycle) {
      billingCycle = this.getAvailableBillingCycles()[0];
    }

    this._formData.billingCycle = billingCycle;

    this.form = new FormGroup({
      apiKey: new FormControl(''),
      projectID: new FormControl(''),
      billingCycle: new FormControl(billingCycle, [Validators.maxLength(this._billingCycleMaxLen)]),
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (
          data.apiKey !== this._formData.apiKey ||
          data.projectID !== this._formData.projectID ||
          data.billingCycle !== this._formData.billingCycle
        ) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
        }
      });
  }

  setValidators(): void {
    if (!this.apiKey.value && !this.projectID.value) {
      this.apiKey.clearValidators();
      this.projectID.clearValidators();
    } else {
      this.apiKey.setValidators([Validators.required, Validators.maxLength(this._apiKeyMaxLen)]);
      this.projectID.setValidators([Validators.required, Validators.maxLength(this._projectIDMaxLen)]);
    }

    this.apiKey.updateValueAndValidity();
    this.projectID.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.apiKey.value && !this.projectID.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getAvailableBillingCycles(): string[] {
    return AVAILABLE_PACKET_BILLING_CYCLES;
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        packet: {
          apiKey: this.form.controls.apiKey.value,
          projectID: this.form.controls.projectID.value,
          billingCycle: this.form.controls.billingCycle.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
