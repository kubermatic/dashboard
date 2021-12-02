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
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {takeUntil} from 'rxjs/operators';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {CredentialsAsyncValidatorService} from '@shared/validators/async-credentials.validator';

export enum Controls {
  ServiceAccount = 'serviceAccount',
}

@Component({
  selector: 'km-gke-credentials',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GKECredentialsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GKECredentialsComponent),
      multi: true,
    },
  ],
})
export class GKECredentialsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _credentialsAsyncValidatorService: CredentialsAsyncValidatorService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ServiceAccount]: this._builder.control('', {
        validators: [Validators.required],
        asyncValidators: [this._credentialsAsyncValidatorService.gkeServiceAccountValidator()],
      }),
    });

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._externalClusterService.credentialsStepValidity = this.form.valid));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this.update());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  update(): void {
    this._externalClusterService.externalCluster = {
      name: '',
      cloud: {
        gke: {
          name: '',
          serviceAccount: this.form.get(Controls.ServiceAccount).value,
        },
      },
    };
  }
}
