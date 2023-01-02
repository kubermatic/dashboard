// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectionStrategy, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {ExternalCloudSpec, ExternalCluster} from '@shared/entity/external-cluster';
import {KubeOneAzureCloudSpec, KubeOneCloudSpec, KubeOneClusterSpec} from '@shared/entity/kubeone-cluster';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  ClientID = 'clientID',
  ClientSecret = 'clientSecret',
  SubscriptionID = 'subscriptionID',
  TenantID = 'tenantID',
}

@Component({
  selector: 'km-kubeone-wizard-azure-credentials-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeOneAzureCredentialsBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeOneAzureCredentialsBasicComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KubeOneAzureCredentialsBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _clusterSpecService: KubeOneClusterSpecService) {
    super('Azure Credentials Basic');
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.ClientID]: this._builder.control('', [Validators.required]),
      [Controls.ClientSecret]: this._builder.control('', [Validators.required]),
      [Controls.SubscriptionID]: this._builder.control('', [Validators.required]),
      [Controls.TenantID]: this._builder.control('', [Validators.required]),
    });
  }

  private _initSubscriptions(): void {
    merge(this._clusterSpecService.providerChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    merge(
      this.form.get(Controls.ClientID).valueChanges,
      this.form.get(Controls.ClientSecret).valueChanges,
      this.form.get(Controls.SubscriptionID).valueChanges,
      this.form.get(Controls.TenantID).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  private _getClusterEntity(): ExternalCluster {
    return {
      cloud: {
        kubeOne: {
          cloudSpec: {
            azure: {
              clientID: this.form.get(Controls.ClientID).value,
              clientSecret: this.form.get(Controls.ClientSecret).value,
              subscriptionID: this.form.get(Controls.SubscriptionID).value,
              tenantID: this.form.get(Controls.TenantID).value,
            } as KubeOneAzureCloudSpec,
          } as KubeOneCloudSpec,
        } as KubeOneClusterSpec,
      } as ExternalCloudSpec,
    } as ExternalCluster;
  }
}
