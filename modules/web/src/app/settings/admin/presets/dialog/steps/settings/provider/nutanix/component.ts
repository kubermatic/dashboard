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
import {NutanixPresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  Username = 'username',
  Password = 'password',
  ProxyURL = 'proxyURL',
  ClusterName = 'clusterName',
  ProjectName = 'projectName',
  CSIUsername = 'csiUsername',
  CSIPassword = 'csiPassword',
  CSIEndpoint = 'csiEndpoint',
  CSIPort = 'csiPort',
}

@Component({
  selector: 'km-nutanix-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NutanixSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NutanixSettingsComponent),
      multi: true,
    },
  ],
})
export class NutanixSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presetDialogService: PresetDialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.ProxyURL]: this._builder.control(''),
      [Controls.ClusterName]: this._builder.control('', Validators.required),
      [Controls.ProjectName]: this._builder.control(''),
      [Controls.CSIUsername]: this._builder.control('', Validators.required),
      [Controls.CSIPassword]: this._builder.control('', Validators.required),
      [Controls.CSIEndpoint]: this._builder.control('', Validators.required),
      [Controls.CSIPort]: this._builder.control(undefined),
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
    delete this._presetDialogService.preset.spec.nutanix;
  }

  private _update(): void {
    this._presetDialogService.preset.spec.nutanix = {
      username: this.form.get(Controls.Username).value,
      password: this.form.get(Controls.Password).value,
      proxyURL: this.form.get(Controls.ProxyURL).value,
      clusterName: this.form.get(Controls.ClusterName).value,
      projectName: this.form.get(Controls.ProjectName).value,
      csiUsername: this.form.get(Controls.CSIUsername).value,
      csiPassword: this.form.get(Controls.CSIPassword).value,
      csiEndpoint: this.form.get(Controls.CSIEndpoint).value,
      csiPort: this.form.get(Controls.CSIPort).value,
    } as NutanixPresetSpec;
  }
}
