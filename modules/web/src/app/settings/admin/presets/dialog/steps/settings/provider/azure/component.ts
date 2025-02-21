// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {AZURE_LOADBALANCER_SKUS} from '@shared/entity/cluster';
import {AzurePresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  TenantID = 'tenantID',
  SubscriptionID = 'subscriptionID',
  ClientID = 'clientID',
  ClientSecret = 'clientSecret',
  ResourceGroup = 'resourceGroup',
  VNetResourceGroup = 'vnetResourceGroup',
  VNet = 'vnet',
  Subnet = 'subnet',
  RouteTable = 'routeTable',
  SecurityGroup = 'securityGroup',
  LoadBalancerSKU = 'loadBalancerSKU',
}

@Component({
    selector: 'km-azure-settings',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AzureSettingsComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AzureSettingsComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class AzureSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  loadBalancerSKUs = AZURE_LOADBALANCER_SKUS;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presetDialogService: PresetDialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.TenantID]: this._builder.control('', Validators.required),
      [Controls.SubscriptionID]: this._builder.control('', Validators.required),
      [Controls.ClientID]: this._builder.control('', Validators.required),
      [Controls.ClientSecret]: this._builder.control('', Validators.required),
      [Controls.ResourceGroup]: this._builder.control(''),
      [Controls.VNetResourceGroup]: this._builder.control(''),
      [Controls.VNet]: this._builder.control(''),
      [Controls.Subnet]: this._builder.control(''),
      [Controls.RouteTable]: this._builder.control(''),
      [Controls.SecurityGroup]: this._builder.control(''),
      [Controls.LoadBalancerSKU]: this._builder.control(''),
    });

    this.form.valueChanges
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._update());

    merge(of(false), this.form.statusChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._presetDialogService.settingsStepValidity = this.form.valid));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    delete this._presetDialogService.preset.spec.azure;
  }

  private _update(): void {
    this._presetDialogService.preset.spec.azure = {
      tenantID: this.form.get(Controls.TenantID).value,
      subscriptionID: this.form.get(Controls.SubscriptionID).value,
      clientID: this.form.get(Controls.ClientID).value,
      clientSecret: this.form.get(Controls.ClientSecret).value,
      resourceGroup: this.form.get(Controls.ResourceGroup).value,
      vnetResourceGroup: this.form.get(Controls.VNetResourceGroup).value,
      vnet: this.form.get(Controls.VNet).value,
      subnet: this.form.get(Controls.Subnet).value,
      routeTable: this.form.get(Controls.RouteTable).value,
      securityGroup: this.form.get(Controls.SecurityGroup).value,
      loadBalancerSKU: this.form.get(Controls.LoadBalancerSKU).value,
    } as AzurePresetSpec;
  }
}
