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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {PresetDialogService} from '@app/settings/admin/presets/create-dialog/steps/service';
import {PacketPresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  ApiKey = 'apiKey',
  ProjectID = 'projectID',
  BillingCycle = 'billingCycle',
}

@Component({
  selector: 'km-packet-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PacketSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PacketSettingsComponent),
      multi: true,
    },
  ],
})
export class PacketSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _presetDialogService: PresetDialogService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ApiKey]: this._builder.control('', Validators.required),
      [Controls.ProjectID]: this._builder.control('', Validators.required),
      [Controls.BillingCycle]: this._builder.control(''),
    });

    this._presetDialogService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this.reset());

    this.form.valueChanges
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._update());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _update(): void {
    this._presetDialogService.preset.spec.packet = {
      apiKey: this.form.get(Controls.ApiKey).value,
      projectID: this.form.get(Controls.ProjectID).value,
      billingCycle: this.form.get(Controls.BillingCycle).value,
    } as PacketPresetSpec;
  }
}
