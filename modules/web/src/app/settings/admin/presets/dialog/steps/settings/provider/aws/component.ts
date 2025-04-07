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
import {AWSPresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  AccessKeyID = 'accessKeyID',
  SecretAccessKey = 'secretAccessKey',
  VpcID = 'vpcID',
  RouteTableID = 'routeTableID',
  InstanceProfileName = 'instanceProfileName',
  SecurityGroupID = 'securityGroupID',
  RoleARN = 'roleARN',
}

@Component({
  selector: 'km-aws-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AWSSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AWSSettingsComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class AWSSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presetDialogService: PresetDialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AccessKeyID]: this._builder.control('', Validators.required),
      [Controls.SecretAccessKey]: this._builder.control('', Validators.required),
      [Controls.VpcID]: this._builder.control(''),
      [Controls.RouteTableID]: this._builder.control(''),
      [Controls.InstanceProfileName]: this._builder.control(''),
      [Controls.SecurityGroupID]: this._builder.control(''),
      [Controls.RoleARN]: this._builder.control(''),
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
    delete this._presetDialogService.preset.spec.aws;
  }

  private _update(): void {
    this._presetDialogService.preset.spec.aws = {
      accessKeyID: this.form.get(Controls.AccessKeyID).value,
      secretAccessKey: this.form.get(Controls.SecretAccessKey).value,
      vpcID: this.form.get(Controls.VpcID).value,
      routeTableID: this.form.get(Controls.RouteTableID).value,
      instanceProfileName: this.form.get(Controls.InstanceProfileName).value,
      securityGroupID: this.form.get(Controls.SecurityGroupID).value,
      roleARN: this.form.get(Controls.RoleARN).value,
    } as AWSPresetSpec;
  }
}
