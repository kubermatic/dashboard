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

import {ChangeDetectionStrategy, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {ExternalCloudSpec, ExternalCluster} from '@shared/entity/external-cluster';
import {KubeOneAWSCloudSpec, KubeOneCloudSpec, KubeOneClusterSpec} from '@shared/entity/kubeone-cluster';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, takeUntil} from 'rxjs/operators';

export enum Controls {
  AccessKeyID = 'accessKeyID',
  AccessKeySecret = 'accessKeySecret',
}

@Component({
  selector: 'km-kubeone-wizard-aws-credentials-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeOneAWSCredentialsBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeOneAWSCredentialsBasicComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KubeOneAWSCredentialsBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _clusterSpecService: KubeOneClusterSpecService) {
    super('AWS Credentials Basic');
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
      [Controls.AccessKeyID]: this._builder.control('', [Validators.required]),
      [Controls.AccessKeySecret]: this._builder.control('', [Validators.required]),
    });
  }

  private _initSubscriptions(): void {
    merge(this._clusterSpecService.providerChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    merge(this.form.get(Controls.AccessKeyID).valueChanges, this.form.get(Controls.AccessKeySecret).valueChanges)
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  private _getClusterEntity(): ExternalCluster {
    return {
      cloud: {
        kubeOne: {
          cloudSpec: {
            aws: {
              accessKeyID: this.form.get(Controls.AccessKeyID).value,
              secretAccessKey: this.form.get(Controls.AccessKeySecret).value,
            } as KubeOneAWSCloudSpec,
          } as KubeOneCloudSpec,
        } as KubeOneClusterSpec,
      } as ExternalCloudSpec,
    } as ExternalCluster;
  }
}
