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
import {PresetsService} from '@core/services/wizard/presets.service';
import {CloudSpec, Cluster, ClusterSpec, VSphereCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {isObjectEmpty} from '@shared/utils/common-utils';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, filter, takeUntil} from 'rxjs/operators';

export enum Controls {
  InfraManagementUsername = 'infraManagementUsername',
  InfraManagementPassword = 'infraManagementPassword',
  Username = 'username',
  Password = 'password',
  UseCustomCloudCredentials = 'useCustomCloudCredentials',
}

@Component({
  selector: 'km-wizard-vsphere-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VSphereProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VSphereProviderBasicComponent),
      multi: true,
    },
  ],
})
export class VSphereProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService
  ) {
    super('VMWare Provider Basic');
  }

  get useCustomCloudCredentials(): boolean {
    return this.form.get(Controls.UseCustomCloudCredentials).value;
  }

  private get _cloudUsername(): string {
    return this.form.get(Controls.Username).value
      ? this.form.get(Controls.Username).value
      : this.form.get(Controls.InfraManagementUsername).value;
  }

  private get _cloudPassword(): string {
    return this.form.get(Controls.Password).value
      ? this.form.get(Controls.Password).value
      : this.form.get(Controls.InfraManagementPassword).value;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InfraManagementUsername]: this._builder.control('', Validators.required),
      [Controls.InfraManagementPassword]: this._builder.control('', Validators.required),
      [Controls.Username]: this._builder.control(''),
      [Controls.Password]: this._builder.control(''),
      [Controls.UseCustomCloudCredentials]: this._builder.control(false),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.VSPHERE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._presets.enablePresets(isObjectEmpty(this._clusterService.cluster.spec.cloud.vsphere)));

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form
      .get(Controls.UseCustomCloudCredentials)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._handleCloudCredentials.bind(this));

    merge(
      this.form.get(Controls.InfraManagementUsername).valueChanges,
      this.form.get(Controls.InfraManagementPassword).valueChanges,
      this.form.get(Controls.Username).valueChanges,
      this.form.get(Controls.Password).valueChanges,
      this.form.get(Controls.UseCustomCloudCredentials).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getCluster()));

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _handleCloudCredentials(selected: boolean): void {
    if (!selected) {
      this.form.get(Controls.Username).clearValidators();
      this.form.get(Controls.Password).clearValidators();
    } else {
      this.form.get(Controls.Username).setValidators(Validators.required);
      this.form.get(Controls.Password).setValidators(Validators.required);
    }

    this.form.get(Controls.Username).setValue('');
    this.form.get(Controls.Password).setValue('');
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getCluster(): Cluster {
    return {
      spec: {
        cloud: {
          vsphere: {
            username: this._cloudUsername,
            password: this._cloudPassword,
            infraManagementUser: {
              username: this.form.get(Controls.InfraManagementUsername).value,
              password: this.form.get(Controls.InfraManagementPassword).value,
            },
          } as VSphereCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
