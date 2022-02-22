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

import {ChangeDetectionStrategy, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, OpenstackCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, filter, takeUntil} from 'rxjs/operators';

enum Controls {
  Domain = 'domain',
  Credentials = 'credentials',
}

@Component({
  selector: 'km-wizard-openstack-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackProviderBasicComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _domains: string[] = ['Default'];
  readonly Controls = Controls;
  isPresetSelected = false;
  domains = this._domains.map(type => ({name: type}));

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('Openstack Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Domain]: this._builder.control('', Validators.required),
      [Controls.Credentials]: this._builder.control(''),
    });

    this._init();

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls).forEach(control => {
        this.isPresetSelected = !!preset;
        this._enable(!this.isPresetSelected, control);
      })
    );

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(
          Object.values(this._clusterSpecService.cluster.spec.cloud.openstack).every(value => !value)
        )
      );

    merge(this.form.get(Controls.Domain).valueChanges.pipe(distinctUntilChanged()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    this._clusterSpecService.cluster = this._getClusterEntity();
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
          openstack: {
            domain: this.form.get(Controls.Domain).value,
          } as OpenstackCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
