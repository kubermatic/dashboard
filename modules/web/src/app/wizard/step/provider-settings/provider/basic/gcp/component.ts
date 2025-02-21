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
import {CloudSpec, Cluster, ClusterSpec, GCPCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {encode, isValid} from 'js-base64';
import {merge} from 'rxjs';
import {distinctUntilChanged, filter, takeUntil} from 'rxjs/operators';

export enum Controls {
  ServiceAccount = 'serviceAccount',
}

@Component({
  selector: 'km-wizard-gcp-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GCPProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GCPProviderBasicComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class GCPProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('GCP Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ServiceAccount]: this._builder.control('', Validators.required),
    });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.GCP))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const gcp = this._clusterSpecService.cluster.spec.cloud.gcp;
        this._presets.enablePresets(
          Cluster.isDualStackNetworkSelected(this._clusterSpecService.cluster)
            ? !gcp.serviceAccount
            : GCPCloudSpec.isEmpty(gcp)
        );
      });

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    this.form
      .get(Controls.ServiceAccount)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
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
          gcp: {
            serviceAccount: this._serviceAccountValue,
          } as GCPCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }

  private get _serviceAccountValue(): string {
    let serviceAccountValue = this.form.get(Controls.ServiceAccount).value;
    if (!!serviceAccountValue && !isValid(serviceAccountValue)) {
      serviceAccountValue = encode(serviceAccountValue);
    }

    return serviceAccountValue;
  }
}
