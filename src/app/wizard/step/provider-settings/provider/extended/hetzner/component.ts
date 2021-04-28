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

import {ChangeDetectionStrategy, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, HetznerCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {DatacenterService} from '@core/services/datacenter';
import {isObjectEmpty} from '@shared/utils/common-utils';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import * as _ from 'lodash';
import {merge} from 'rxjs';
import {filter, takeUntil, distinctUntilChanged, switchMap, take, tap} from 'rxjs/operators';

enum Controls {
  Network = 'network',
}

@Component({
  selector: 'km-wizard-hetzner-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HetznerProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HetznerProviderExtendedComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HetznerProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  defaultNetwork = '';

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService
  ) {
    super('Hetzner Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Network]: this._builder.control(''),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.HETZNER))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._presets.enablePresets(isObjectEmpty(this._clusterService.cluster.spec.cloud.hetzner)));

    this.form
      .get(Controls.Network)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getCluster()));

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.HETZNER))
      .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterService.datacenter).pipe(take(1))))
      .pipe(tap(dc => (this.defaultNetwork = dc.spec.hetzner.network)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
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

  private _getCluster(): Cluster {
    return {
      spec: {
        cloud: {
          hetzner: {
            network: this.form.get(Controls.Network).value,
          } as HetznerCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
