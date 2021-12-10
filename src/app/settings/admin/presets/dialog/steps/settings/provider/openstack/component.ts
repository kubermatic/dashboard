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
import {OpenstackPresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  Username = 'username',
  Password = 'password',
  Project = 'project',
  ProjectID = 'projectID',
  Domain = 'domain',
  Network = 'network',
  SecurityGroups = 'securityGroups',
  FloatingIpPool = 'floatingIpPool',
  RouterID = 'routerID',
  SubnetID = 'subnetID',
}

@Component({
  selector: 'km-openstack-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackSettingsComponent),
      multi: true,
    },
  ],
})
export class OpenstackSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _presetDialogService: PresetDialogService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.Project]: this._builder.control('', Validators.required),
      [Controls.ProjectID]: this._builder.control('', Validators.required),
      [Controls.Domain]: this._builder.control('', Validators.required),
      [Controls.Network]: this._builder.control(''),
      [Controls.SecurityGroups]: this._builder.control(''),
      [Controls.FloatingIpPool]: this._builder.control(''),
      [Controls.RouterID]: this._builder.control(''),
      [Controls.SubnetID]: this._builder.control(''),
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
    delete this._presetDialogService.preset.spec.openstack;
  }

  private _update(): void {
    this._presetDialogService.preset.spec.openstack = {
      username: this.form.get(Controls.Username).value,
      password: this.form.get(Controls.Password).value,
      project: this.form.get(Controls.Project).value,
      projectID: this.form.get(Controls.ProjectID).value,
      domain: this.form.get(Controls.Domain).value,
      network: this.form.get(Controls.Network).value,
      securityGroups: this.form.get(Controls.SecurityGroups).value,
      floatingIpPool: this.form.get(Controls.FloatingIpPool).value,
      routerID: this.form.get(Controls.RouterID).value,
      subnetID: this.form.get(Controls.SubnetID).value,
    } as OpenstackPresetSpec;
  }
}
