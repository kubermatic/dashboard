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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, VMwareCloudDirectorCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {debounceTime, filter, takeUntil} from 'rxjs/operators';

export enum Controls {
  Username = 'username',
  Password = 'password',
  Organization = 'organization',
  Vdc = 'vdc',
}

@Component({
  selector: 'km-wizard-vmware-cloud-director-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VMwareCloudDirectorProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VMwareCloudDirectorProviderBasicComponent),
      multi: true,
    },
  ],
})
export class VMwareCloudDirectorProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  isPresetSelected = false;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('VMware Cloud Director Provider Basic');
  }

  ngOnInit(): void {
    this._initForm();

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._clusterSpecService.cluster = this._getClusterEntity();
        this._presets.enablePresets(
          VMwareCloudDirectorCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector)
        );
      });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
      Object.values(Controls).forEach(control => {
        this._enable(!this.isPresetSelected, control);
      });
    });

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.Organization]: this._builder.control('', Validators.required),
      [Controls.Vdc]: this._builder.control('', Validators.required),
    });
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          vmwareclouddirector: {
            username: this.form.get(Controls.Username).value,
            password: this.form.get(Controls.Password).value,
            organization: this.form.get(Controls.Organization).value,
            vdc: this.form.get(Controls.Vdc).value,
          } as VMwareCloudDirectorCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
