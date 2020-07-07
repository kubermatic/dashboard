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

import {WizardService} from '../../../../../core/services';
import {Cluster} from '../../../../../shared/entity/cluster';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';

@Component({
  selector: 'km-azure-provider-options',
  templateUrl: './azure-provider-options.component.html',
})
export class AzureProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;

  hideOptional = true;
  form: FormGroup;

  private _selectedPreset: string;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      resourceGroup: new FormControl(this.cluster.spec.cloud.azure.resourceGroup),
      routeTable: new FormControl(this.cluster.spec.cloud.azure.routeTable),
      securityGroup: new FormControl(this.cluster.spec.cloud.azure.securityGroup),
      subnet: new FormControl(this.cluster.spec.cloud.azure.subnet),
      vnet: new FormControl(this.cluster.spec.cloud.azure.vnet),
    });

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._wizardService.changeClusterProviderSettings(
          this._clusterProviderSettingsForm(this._hasRequiredCredentials())
        );
      });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.cluster.spec.cloud.azure = data.cloudSpec.azure;
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.hideOptional = data.hideOptional;
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      this._selectedPreset = newCredentials;
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  private _hasRequiredCredentials(): boolean {
    return (
      (this.cluster.spec.cloud.azure.clientID !== '' &&
        this.cluster.spec.cloud.azure.clientSecret !== '' &&
        this.cluster.spec.cloud.azure.subscriptionID !== '' &&
        this.cluster.spec.cloud.azure.tenantID !== '') ||
      !!this._selectedPreset
    );
  }

  private _clusterProviderSettingsForm(isValid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        azure: {
          clientID: this.cluster.spec.cloud.azure.clientID,
          clientSecret: this.cluster.spec.cloud.azure.clientSecret,
          subscriptionID: this.cluster.spec.cloud.azure.subscriptionID,
          tenantID: this.cluster.spec.cloud.azure.tenantID,
          resourceGroup: this.form.controls.resourceGroup.value,
          routeTable: this.form.controls.routeTable.value,
          securityGroup: this.form.controls.securityGroup.value,
          subnet: this.form.controls.subnet.value,
          vnet: this.form.controls.vnet.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid: isValid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
