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
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  TenantID = 'tenantID',
  SubscriptionID = 'subscriptionID',
  ClientID = 'clientID',
  ClientSecret = 'clientSecret',
}

@Component({
    selector: 'km-aks-settings',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AKSSettingsComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AKSSettingsComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class AKSSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

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
    delete this._presetDialogService.preset.spec.aks;
  }

  private _update(): void {
    this._presetDialogService.preset.spec.aks = {
      tenantID: this.form.get(Controls.TenantID).value,
      subscriptionID: this.form.get(Controls.SubscriptionID).value,
      clientID: this.form.get(Controls.ClientID).value,
      clientSecret: this.form.get(Controls.ClientSecret).value,
    };
  }
}
