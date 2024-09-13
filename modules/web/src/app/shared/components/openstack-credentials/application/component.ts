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
import {debounceTime, distinctUntilChanged, filter, takeUntil} from 'rxjs/operators';

enum Controls {
  ApplicationCredentialID = 'applicationCredentialID',
  ApplicationCredentialSecret = 'applicationCredentialSecret',
}

@Component({
  selector: 'km-openstack-application-credentials',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackApplicationCredentialsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackApplicationCredentialsComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackApplicationCredentialsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 250;
  readonly Controls = Controls;
  isPresetSelected = false;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('Openstack Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ApplicationCredentialID]: this._builder.control('', Validators.required),
      [Controls.ApplicationCredentialSecret]: this._builder.control('', Validators.required),
    });

    merge(
      this.form.get(Controls.ApplicationCredentialID).valueChanges.pipe(distinctUntilChanged()),
      this.form.get(Controls.ApplicationCredentialSecret).valueChanges.pipe(distinctUntilChanged())
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls).forEach(control => {
        this.isPresetSelected = !!preset;
        this._enable(!this.isPresetSelected, control);
      })
    );

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(OpenstackCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.openstack))
      );

    this.form.reset();
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
          openstack: {
            applicationCredentialID: this.form.get(Controls.ApplicationCredentialID).value,
            applicationCredentialSecret: this.form.get(Controls.ApplicationCredentialSecret).value,
          } as OpenstackCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
