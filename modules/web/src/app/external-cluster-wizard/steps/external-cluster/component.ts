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

import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator} from '@angular/forms';
import {ExternalClusterService} from '@core/services/external-cluster';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {filter, takeUntil} from 'rxjs/operators';
import {StepBase} from '../base';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';

enum Controls {
  AKSExternalCluster = 'AKSExternalCluster',
  EKSExternalCluster = 'EKSExternalCluster',
  GKEExternalCluster = 'GKEExternalCluster',
}

@Component({
  selector: 'km-external-cluster-step',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExternalClusterStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ExternalClusterStepComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class ExternalClusterStepComponent
  extends StepBase
  implements OnInit, OnDestroy, ControlValueAccessor, Validator
{
  readonly Controls = Controls;
  readonly Provider = ExternalClusterProvider;

  selectedProvider: ExternalClusterProvider;
  @Input() projectID: string;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onActivate(component: QuotaWidgetComponent): void {
    component.projectId = this.projectID;
    component.isExternalCluster = true;
    component.showAsCard = false;
    component.showDetailsOnHover = false;
  }

  private _initForm() {
    this.form = this._builder.group({
      [Controls.AKSExternalCluster]: this._builder.control(''),
      [Controls.EKSExternalCluster]: this._builder.control(''),
      [Controls.GKEExternalCluster]: this._builder.control(''),
    });
  }

  private _initSubscriptions() {
    this._externalClusterService.providerChanges
      .pipe(filter(provider => !!provider && provider !== this.selectedProvider))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => {
        this.selectedProvider = provider;
        this.form.reset();
      });
  }
}
