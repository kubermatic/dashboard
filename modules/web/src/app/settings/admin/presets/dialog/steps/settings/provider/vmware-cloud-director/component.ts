// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {clearFormField} from '@app/shared/utils/form';
import {VMwareCloudDirectorPresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  Username = 'username',
  Password = 'password',
  APIToken = 'apiToken',
  Organization = 'organization',
  Vdc = 'vdc',
  OvdcNetwork = 'ovdcNetwork',
}

export enum CredentialsType {
  Default = 'default',
  APIToken = 'apiToken',
}

@Component({
  selector: 'km-vmware-cloud-director-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VMwareCloudDirectorSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VMwareCloudDirectorSettingsComponent),
      multi: true,
    },
  ],
})
export class VMwareCloudDirectorSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly CredentialsType = CredentialsType;
  selectedCredentialsType = CredentialsType.Default;

  constructor(private readonly _builder: FormBuilder, private readonly _presetDialogService: PresetDialogService) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this.changeView(this.selectedCredentialsType);

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
    delete this._presetDialogService.preset.spec.vmwareclouddirector;
  }

  changeView(value: CredentialsType): void {
    this.selectedCredentialsType = value;

    if (this.selectedCredentialsType === CredentialsType.Default) {
      clearFormField(this.form, Controls.APIToken);

      this.form.get(Controls.Username).setValidators(Validators.required);
      this.form.get(Controls.Password).setValidators(Validators.required);
    } else {
      clearFormField(this.form, Controls.Username);
      clearFormField(this.form, Controls.Password);

      this.form.get(Controls.APIToken).setValidators(Validators.required);
    }
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control(''),
      [Controls.Password]: this._builder.control(''),
      [Controls.APIToken]: this._builder.control(''),
      [Controls.Organization]: this._builder.control('', Validators.required),
      [Controls.Vdc]: this._builder.control('', Validators.required),
      [Controls.OvdcNetwork]: this._builder.control('', Validators.required),
    });
  }

  private _update(): void {
    this._presetDialogService.preset.spec.vmwareclouddirector = {
      username: this.form.get(Controls.Username).value,
      password: this.form.get(Controls.Password).value,
      apiToken: this.form.get(Controls.APIToken).value,
      organization: this.form.get(Controls.Organization).value,
      vdc: this.form.get(Controls.Vdc).value,
      ovdcNetwork: this.form.get(Controls.OvdcNetwork).value,
    } as VMwareCloudDirectorPresetSpec;
  }
}
