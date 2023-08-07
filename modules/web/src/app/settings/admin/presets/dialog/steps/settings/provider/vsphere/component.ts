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
import {VSpherePresetSpec} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  Username = 'username',
  Password = 'password',
  Networks = 'networks',
  Datastore = 'datastore',
  DatastoreCluster = 'datastoreCluster',
  ResourcePool = 'resourcePool',
}

@Component({
  selector: 'km-vsphere-settings',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VSphereSettingsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VSphereSettingsComponent),
      multi: true,
    },
  ],
})
export class VSphereSettingsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  networks: string[] = [];

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presetDialogService: PresetDialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control(null, Validators.required),
      [Controls.Password]: this._builder.control(null, Validators.required),
      [Controls.Networks]: this._builder.control([]),
      [Controls.Datastore]: this._builder.control(null),
      [Controls.DatastoreCluster]: this._builder.control(null),
      [Controls.ResourcePool]: this._builder.control(null),
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
    delete this._presetDialogService.preset.spec.vsphere;
  }

  onNetworksChange(networks: string[]): void {
    this.networks = networks;
    this.form.get(Controls.Networks).updateValueAndValidity();
  }

  private _update(): void {
    this._presetDialogService.preset.spec.vsphere = {
      username: this.form.get(Controls.Username).value,
      password: this.form.get(Controls.Password).value,
      networks: this.form.get(Controls.Networks).value?.tags,
      datastore: this.form.get(Controls.Datastore).value,
      datastoreCluster: this.form.get(Controls.DatastoreCluster).value,
      resourcePool: this.form.get(Controls.ResourcePool).value,
    } as VSpherePresetSpec;
  }
}
