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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../core/services';
import {AVAILABLE_PACKET_BILLING_CYCLES, Cluster} from '../../../../shared/entity/cluster';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'km-packet-cluster-settings',
  templateUrl: './packet.component.html',
})
export class PacketClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  form: FormGroup;

  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private _wizard: WizardService) {}

  ngOnInit(): void {
    const billingCycle = this.cluster.spec.cloud.packet.billingCycle
      ? this.cluster.spec.cloud.packet.billingCycle
      : this.getAvailableBillingCycles()[0];

    this.form = new FormGroup({
      apiKey: new FormControl(this.cluster.spec.cloud.packet.apiKey, [Validators.required, Validators.maxLength(256)]),
      projectID: new FormControl(this.cluster.spec.cloud.packet.projectID, [
        Validators.required,
        Validators.maxLength(256),
      ]),
      billingCycle: new FormControl(billingCycle, [Validators.maxLength(64)]),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(this.form.controls.apiKey, this.form.controls.projectID);

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._formHelper.areControlsValid()
          ? this._wizard.onCustomPresetsDisable.emit(false)
          : this._wizard.onCustomPresetsDisable.emit(true);

        this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
      });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  getAvailableBillingCycles(): string[] {
    return AVAILABLE_PACKET_BILLING_CYCLES;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        packet: {
          apiKey: this.form.controls.apiKey.value,
          projectID: this.form.controls.projectID.value,
          billingCycle: this.form.controls.billingCycle.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }
}
