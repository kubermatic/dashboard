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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, VSphereCloudSpec, VSphereInfraManagementUser} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {isObjectEmpty} from '@shared/utils/common';
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
    standalone: false
})
export class VSphereProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('VMWare Provider Basic');
  }

  get useCustomCloudCredentials(): boolean {
    return this.form.get(Controls.UseCustomCloudCredentials).value;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.InfraManagementUsername]: this._builder.control(''),
      [Controls.InfraManagementPassword]: this._builder.control(''),
      [Controls.UseCustomCloudCredentials]: this._builder.control(false),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VSPHERE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._presets.enablePresets(isObjectEmpty(this._clusterSpecService.cluster.spec.cloud.vsphere)));

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
      .subscribe(_ => (this._clusterSpecService.cluster = this._getCluster()));

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _handleCloudCredentials(selected: boolean): void {
    if (!selected) {
      this.form.get(Controls.InfraManagementUsername).clearValidators();
      this.form.get(Controls.InfraManagementPassword).clearValidators();
    } else {
      this.form.get(Controls.InfraManagementUsername).setValidators(Validators.required);
      this.form.get(Controls.InfraManagementPassword).setValidators(Validators.required);
    }

    this.form.get(Controls.InfraManagementUsername).setValue('');
    this.form.get(Controls.InfraManagementPassword).setValue('');
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
    let infraUser = null;
    if (this.useCustomCloudCredentials) {
      infraUser = {
        username: this.form.get(Controls.InfraManagementUsername).value,
        password: this.form.get(Controls.InfraManagementPassword).value,
      } as VSphereInfraManagementUser;
    }

    return {
      spec: {
        cloud: {
          vsphere: {
            username: this.form.get(Controls.Username).value,
            password: this.form.get(Controls.Password).value,
            infraManagementUser: infraUser,
          } as VSphereCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
