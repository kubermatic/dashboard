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

import {ChangeDetectorRef, Component, forwardRef, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {StepRegistry} from '@app/kubeone-wizard/config';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';

import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  CredentialsBasic = 'credentialsBasic',
}

@Component({
  selector: 'km-kubeone-wizard-credentials-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeOneCredentialsBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeOneCredentialsBasicComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class KubeOneCredentialsBasicComponent extends BaseFormValidator implements OnInit {
  readonly NodeProvider = NodeProvider;
  readonly Control = Controls;

  provider: NodeProvider;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: KubeOneClusterSpecService,
    private _cdr: ChangeDetectorRef
  ) {
    super(`${StepRegistry.Credentials} Basic`);
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.CredentialsBasic]: this._builder.control(''),
    });
  }

  private _initSubscriptions(): void {
    this._clusterSpecService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(provider => {
      this.form.removeControl(Controls.CredentialsBasic);
      this.form.addControl(Controls.CredentialsBasic, this._builder.control(''));
      this.provider = provider;
      // trigger detect changes to initialize child forms and then update form validity
      this._cdr.detectChanges();
      this.form.updateValueAndValidity();
    });
  }
}
