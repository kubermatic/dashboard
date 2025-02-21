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
import {merge, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Control {
  AccessKeyID = 'accessKeyID',
  AccessKeySecret = 'accessKeySecret',
}

@Component({
    selector: 'km-alibaba-provider-settings',
    templateUrl: './template.html',
    standalone: false
})
export class AlibabaProviderSettingsComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Control = Control;
  form: FormGroup;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _builder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Control.AccessKeyID]: this._builder.control('', Validators.required),
      [Control.AccessKeySecret]: this._builder.control('', Validators.required),
    });

    merge(this.form.get(Control.AccessKeyID).valueChanges, this.form.get(Control.AccessKeySecret).valueChanges)
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
        alibaba: {
          accessKeyID: this.form.get(Control.AccessKeyID).value,
          accessKeySecret: this.form.get(Control.AccessKeySecret).value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
