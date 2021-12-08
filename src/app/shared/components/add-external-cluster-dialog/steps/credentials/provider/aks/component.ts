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
import {takeUntil} from 'rxjs/operators';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {Subject} from 'rxjs';

export enum Controls {
  TenantID = 'tenantID',
  SubscriptionID = 'subscriptionID',
  ClientID = 'clientID',
  ClientSecret = 'clientSecret',
  ResourceGroup = 'resourceGroup',
}

@Component({
  selector: 'km-aks-credentials',
  templateUrl: './template.html',
})
export class AKSCredentialsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  readonly Controls = Controls;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.TenantID]: this._builder.control('', {
        validators: [Validators.required],
        //asyncValidators: [this._credentialsAsyncValidatorService.gkeServiceAccountValidator()],
      }),
      [Controls.SubscriptionID]: this._builder.control('', {
        validators: [Validators.required],
        //asyncValidators: [this._credentialsAsyncValidatorService.gkeServiceAccountValidator()],
      }),
      [Controls.ClientID]: this._builder.control('', {
        validators: [Validators.required],
        //asyncValidators: [this._credentialsAsyncValidatorService.gkeServiceAccountValidator()],
      }),
      [Controls.ClientSecret]: this._builder.control('', {
        validators: [Validators.required],
        //asyncValidators: [this._credentialsAsyncValidatorService.gkeServiceAccountValidator()],
      }),
      [Controls.ResourceGroup]: this._builder.control('', {
        validators: [Validators.required],
        //asyncValidators: [this._credentialsAsyncValidatorService.gkeServiceAccountValidator()],
      }),
    });

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._externalClusterService.credentialsStepValidity = this.form.valid));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._externalClusterService.isPresetEnabled = Object.values(Controls).every(c => !this.form.get(c).value);
      this.update();
    });

    this._externalClusterService.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  update(): void {
    this._externalClusterService.externalCluster = {
      name: '',
      cloud: {
        aks: {
          name: '',
          tenantID: this.form.get(Controls.TenantID).value,
          subscriptionID: this.form.get(Controls.SubscriptionID).value,
          clientID: this.form.get(Controls.ClientID).value,
          clientSecret: this.form.get(Controls.ClientSecret).value,
          resourceGroup: this.form.get(Controls.ResourceGroup).value,
        },
      },
    };
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}
