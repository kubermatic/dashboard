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
import {Subject} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  Username = 'username',
  Password = 'password',
  ProxyURL = 'proxyURL',
  ClusterName = 'clusterName',
  ProjectName = 'projectName',
}

@Component({
    selector: 'km-nutanix-provider-settings',
    templateUrl: './template.html',
    standalone: false
})
export class NutanixProviderSettingsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  form: FormGroup;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _builder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.ProxyURL]: this._builder.control(''),
      [Controls.ClusterName]: this._builder.control('', Validators.required),
      [Controls.ProjectName]: this._builder.control(''),
    });

    this.form.valueChanges
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._clusterService.changeProviderSettingsPatch(this._getProviderSettingsPatch()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        nutanix: {
          username: this.form.get(Controls.Username).value,
          password: this.form.get(Controls.Password).value,
          proxyURL: this.form.get(Controls.ProxyURL).value,
          clusterName: this.form.get(Controls.ClusterName).value,
          projectName: this.form.get(Controls.ProjectName).value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
