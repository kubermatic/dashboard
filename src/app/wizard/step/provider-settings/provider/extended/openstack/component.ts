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
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  CredentialsType,
  OpenstackCredentialsTypeService,
} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  Credentials = 'credentials',
}

@Component({
  selector: 'km-wizard-openstack-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackProviderExtendedComponent),
      multi: true,
    },
  ],
})
export class OpenstackProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly CredentialsType = CredentialsType;

  get credentialsType(): CredentialsType {
    return this._credentialsTypeService.credentialsType;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService
  ) {
    super('Openstack Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Credentials]: this._builder.control(''),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
