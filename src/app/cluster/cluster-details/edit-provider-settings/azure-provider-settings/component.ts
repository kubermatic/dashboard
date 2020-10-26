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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {ClusterService} from '@core/services/cluster/cluster.service';
import {ProviderSettingsPatch} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-azure-provider-settings',
  templateUrl: './template.html',
})
export class AzureProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;

  private readonly _debounceTime = 1000;
  private _formData = {
    clientID: '',
    clientSecret: '',
    subscriptionID: '',
    tenantID: '',
  };
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      clientID: new FormControl(''),
      clientSecret: new FormControl(''),
      subscriptionID: new FormControl(''),
      tenantID: new FormControl(''),
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (
          data.clientID !== this._formData.clientID ||
          data.clientSecret !== this._formData.clientSecret ||
          data.subscriptionID !== this._formData.subscriptionID ||
          data.tenantID !== this._formData.tenantID
        ) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
        }
      });
  }

  get clientID(): AbstractControl {
    return this.form.controls.clientID;
  }

  get clientSecret(): AbstractControl {
    return this.form.controls.clientSecret;
  }

  get subscriptionID(): AbstractControl {
    return this.form.controls.subscriptionID;
  }

  get tenantID(): AbstractControl {
    return this.form.controls.tenantID;
  }

  setValidators(): void {
    if (!this.clientID.value && !this.clientSecret.value && !this.subscriptionID.value && !this.tenantID.value) {
      this.clientID.clearValidators();
      this.clientSecret.clearValidators();
      this.subscriptionID.clearValidators();
      this.tenantID.clearValidators();
    } else {
      this.clientID.setValidators([Validators.required]);
      this.clientSecret.setValidators([Validators.required]);
      this.subscriptionID.setValidators([Validators.required]);
      this.tenantID.setValidators([Validators.required]);
    }

    this.clientID.updateValueAndValidity();
    this.clientSecret.updateValueAndValidity();
    this.subscriptionID.updateValueAndValidity();
    this.tenantID.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.clientID.value && !this.clientSecret.value && !this.subscriptionID.value && !this.tenantID.value
      ? ''
      : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        azure: {
          clientID: this.form.controls.clientID.value,
          clientSecret: this.form.controls.clientSecret.value,
          subscriptionID: this.form.controls.subscriptionID.value,
          tenantID: this.form.controls.tenantID.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
