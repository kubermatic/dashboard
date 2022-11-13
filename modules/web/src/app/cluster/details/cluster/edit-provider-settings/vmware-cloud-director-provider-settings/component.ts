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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ClusterService} from '@core/services/cluster';
import {ProviderSettingsPatch, VMwareCloudDirectorCloudSpecPatch} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  Username = 'username',
  Password = 'password',
  Organization = 'organization',
  VDC = 'vdc',
  OvdcNetwork = 'ovdcNetwork',
}

@Component({
  selector: 'km-vmware-cloud-director-provider-settings',
  templateUrl: './template.html',
})
export class VMwareCloudDirectorProviderSettingsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  form: FormGroup;

  constructor(private readonly _clusterService: ClusterService, private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this._initForm();

    this.form.valueChanges
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._clusterService.changeProviderSettingsPatch(this._getProviderSettingsPatch()));
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
      [Controls.VDC]: this._builder.control('', Validators.required),
      [Controls.OvdcNetwork]: this._builder.control('', Validators.required),
    });
  }

  private _getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        vmwareclouddirector: {
          username: this.form.get(Controls.Username).value,
          password: this.form.get(Controls.Password).value,
          organization: this.form.get(Controls.Organization).value,
          vdc: this.form.get(Controls.VDC).value,
          ovdcNetwork: this.form.get(Controls.OvdcNetwork).value,
        } as VMwareCloudDirectorCloudSpecPatch,
      },
      isValid: this.form.valid,
    };
  }
}
