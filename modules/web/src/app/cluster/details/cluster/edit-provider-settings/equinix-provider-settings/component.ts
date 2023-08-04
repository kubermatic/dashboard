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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ClusterService} from '@core/services/cluster';
import {AVAILABLE_EQUINIX_BILLING_CYCLES, ProviderSettingsPatch} from '@shared/entity/cluster';
import {merge, Subject} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

enum Control {
  ApiKey = 'apiKey',
  ProjectID = 'projectID',
  BillingCycle = 'billingCycle',
}

@Component({
  selector: 'km-equinix-provider-settings',
  templateUrl: './template.html',
})
export class EquinixProviderSettingsComponent implements OnInit, OnDestroy {
  private readonly _billingCycleMaxLen = 64;
  private readonly _apiKeyMaxLen = 64;
  private readonly _projectIDMaxLen = 64;
  private readonly _unsubscribe = new Subject<void>();
  readonly Control = Control;
  @Input() billingCycle: string;
  form: FormGroup;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _builder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Control.ApiKey]: this._builder.control('', [Validators.required, Validators.maxLength(this._apiKeyMaxLen)]),
      [Control.ProjectID]: this._builder.control('', [
        Validators.required,
        Validators.maxLength(this._projectIDMaxLen),
      ]),
      [Control.BillingCycle]: this._builder.control(this._getDefaultBillingCycle(), [
        Validators.required,
        Validators.maxLength(this._billingCycleMaxLen),
      ]),
    });

    merge(
      this.form.get(Control.ApiKey).valueChanges,
      this.form.get(Control.ProjectID).valueChanges,
      this.form.get(Control.BillingCycle).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._clusterService.changeProviderSettingsPatch(this._getProviderSettingsPatch()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getAvailableBillingCycles(): string[] {
    return AVAILABLE_EQUINIX_BILLING_CYCLES;
  }

  private _getDefaultBillingCycle(): string {
    return this.billingCycle || this.getAvailableBillingCycles()[0];
  }

  private _getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        packet: {
          apiKey: this.form.get(Control.ApiKey).value,
          projectID: this.form.get(Control.ProjectID).value,
          billingCycle: this.form.get(Control.BillingCycle).value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
