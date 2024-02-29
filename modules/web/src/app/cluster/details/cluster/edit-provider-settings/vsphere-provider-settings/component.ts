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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ClusterService} from '@core/services/cluster';
import {ProviderSettingsPatch} from '@shared/entity/cluster';
import {Subject, merge} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

enum Control {
  InfraManagementUsername = 'infraManagementUsername',
  InfraManagementPassword = 'infraManagementPassword',
  UseCustomCloudCredentials = 'useCustomCloudCredentials',
  Username = 'username',
  Password = 'password',
}

@Component({
  selector: 'km-vsphere-provider-settings',
  templateUrl: './template.html',
})
export class VSphereProviderSettingsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Control = Control;
  form: FormGroup;

  constructor(private readonly _clusterService: ClusterService, private readonly _builder: FormBuilder) {}

  get useCustomCloudCredentials(): boolean {
    return this.form.get(Control.UseCustomCloudCredentials).value;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Control.Username]: this._builder.control('', Validators.required),
      [Control.Password]: this._builder.control('', Validators.required),
      [Control.InfraManagementUsername]: this._builder.control(''),
      [Control.InfraManagementPassword]: this._builder.control(''),
      [Control.UseCustomCloudCredentials]: this._builder.control(false),
    });

    this.form
      .get(Control.UseCustomCloudCredentials)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._handleCloudCredentials.bind(this));

    merge(
      this.form.get(Control.InfraManagementUsername).valueChanges,
      this.form.get(Control.InfraManagementPassword).valueChanges,
      this.form.get(Control.Username).valueChanges,
      this.form.get(Control.Password).valueChanges,
      this.form.get(Control.UseCustomCloudCredentials).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._clusterService.changeProviderSettingsPatch(this._getProviderSettingsPatch()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _handleCloudCredentials(selected: boolean): void {
    if (!selected) {
      this.form.get(Control.InfraManagementUsername).clearValidators();
      this.form.get(Control.InfraManagementPassword).clearValidators();
    } else {
      this.form.get(Control.InfraManagementUsername).setValidators(Validators.required);
      this.form.get(Control.InfraManagementPassword).setValidators(Validators.required);
    }

    this.form.get(Control.InfraManagementUsername).setValue('');
    this.form.get(Control.InfraManagementPassword).setValue('');
  }

  private _getProviderSettingsPatch(): ProviderSettingsPatch {
    let infraManagementUser = null;
    if (this.useCustomCloudCredentials) {
      infraManagementUser = {
        username: this.form.get(Control.InfraManagementUsername).value,
        password: this.form.get(Control.InfraManagementPassword).value,
      };
    }

    return {
      cloudSpecPatch: {
        vsphere: {
          password: this.form.get(Control.Password).value,
          username: this.form.get(Control.Username).value,
          infraManagementUser: infraManagementUser,
        },
      },
      isValid: this.form.valid,
    };
  }
}
