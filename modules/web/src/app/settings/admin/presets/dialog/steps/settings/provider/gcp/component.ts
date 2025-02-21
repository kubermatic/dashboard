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
import {GCPPresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {encode, isValid} from 'js-base64';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  ServiceAccount = 'serviceAccount',
  Network = 'network',
  Subnetwork = 'subnetwork',
}

@Component({
    selector: 'km-gcp-settings',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => GCPSettingsComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => GCPSettingsComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class GCPSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presetDialogService: PresetDialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ServiceAccount]: this._builder.control('', Validators.required),
      [Controls.Network]: this._builder.control(''),
      [Controls.Subnetwork]: this._builder.control(''),
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
    delete this._presetDialogService.preset.spec.gcp;
  }

  private _update(): void {
    this._presetDialogService.preset.spec.gcp = {
      serviceAccount: this._serviceAccountValue,
      network: this.form.get(Controls.Network).value,
      subnetwork: this.form.get(Controls.Subnetwork).value,
    } as GCPPresetSpec;
  }

  private get _serviceAccountValue(): string {
    let serviceAccountValue = this.form.get(Controls.ServiceAccount).value;
    if (!!serviceAccountValue && !isValid(serviceAccountValue)) {
      serviceAccountValue = encode(serviceAccountValue);
    }

    return serviceAccountValue;
  }
}
