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
import {take, takeUntil} from 'rxjs/operators';
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
  isValidationPending = false;
  areCredentialsValid = false;
  readonly Controls = Controls;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.TenantID]: this._builder.control('', [Validators.required]),
      [Controls.SubscriptionID]: this._builder.control('', [Validators.required]),
      [Controls.ClientID]: this._builder.control('', [Validators.required]),
      [Controls.ClientSecret]: this._builder.control('', [Validators.required]),
      [Controls.ResourceGroup]: this._builder.control('', [Validators.required]),
    });

    this.form.statusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._updateStepValidity());

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._update();
      this._validate();
      this._externalClusterService.isPresetEnabled = Object.values(Controls).every(c => !this.form.get(c).value);
    });

    this._externalClusterService.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _validate(): void {
    this.isValidationPending = true;
    const tenantID = this.form.get(Controls.TenantID).value;
    const subscriptionID = this.form.get(Controls.SubscriptionID).value;
    const clientID = this.form.get(Controls.ClientID).value;
    const clientSecret = this.form.get(Controls.ClientSecret).value;
    if (tenantID && subscriptionID && clientID && clientSecret) {
      this._externalClusterService
        .validateAKSCredentials(tenantID, subscriptionID, clientID, clientSecret)
        .pipe(take(1))
        .subscribe({
          next: _ => {
            this.isValidationPending = false;
            this.areCredentialsValid = true;
            this._updateStepValidity();
          },
          error: _ => {
            this.isValidationPending = false;
            this.areCredentialsValid = false;
            this._updateStepValidity();
          },
        });
    } else {
      this.isValidationPending = false;
      this.areCredentialsValid = false;
      this._updateStepValidity();
    }
  }

  private _updateStepValidity(): void {
    this._externalClusterService.credentialsStepValidity =
      this.form.valid && this.areCredentialsValid && !this.isValidationPending;
  }

  private _update(): void {
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
