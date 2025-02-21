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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {
  AVAILABLE_EQUINIX_BILLING_CYCLES,
  CloudSpec,
  Cluster,
  ClusterSpec,
  EquinixCloudSpec,
} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, filter, takeUntil} from 'rxjs/operators';

export enum Controls {
  APIKey = 'apiKey',
  ProjectID = 'projectID',
  BillingCycle = 'billingCycle',
}

@Component({
  selector: 'km-wizard-equinix-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquinixProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EquinixProviderBasicComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class EquinixProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _apiKeyLength = 256;
  private readonly _projectIDLength = 256;
  private readonly _billingCycleLength = 64;

  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('Equinix Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.APIKey]: this._builder.control('', [Validators.required, Validators.maxLength(this._apiKeyLength)]),
      [Controls.ProjectID]: this._builder.control('', [
        Validators.required,
        Validators.maxLength(this._projectIDLength),
      ]),
      [Controls.BillingCycle]: this._builder.control(this.getAvailableBillingCycles()[0], [
        Validators.required,
        Validators.maxLength(this._billingCycleLength),
      ]),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.EQUINIX))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value))
      );

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(
      this.form.get(Controls.APIKey).valueChanges,
      this.form.get(Controls.ProjectID).valueChanges,
      this.form.get(Controls.BillingCycle).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
  }

  getAvailableBillingCycles(): string[] {
    return AVAILABLE_EQUINIX_BILLING_CYCLES;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          packet: {
            apiKey: this.form.get(Controls.APIKey).value,
            projectID: this.form.get(Controls.ProjectID).value,
            billingCycle: this.form.get(Controls.BillingCycle).value,
          } as EquinixCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
