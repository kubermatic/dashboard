// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';

import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {WizardService} from '@core/services/wizard/wizard';
import {StepBase} from '../base';

enum Controls {
  ProviderBasic = 'providerBasic',
  ProviderExtended = 'providerExtended',
  Preset = 'preset',
}

@Component({
    selector: 'km-wizard-provider-settings-step',
    templateUrl: './template.html',
    styleUrls: ['style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ProviderSettingsStepComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => ProviderSettingsStepComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class ProviderSettingsStepComponent extends StepBase implements OnInit, OnDestroy {
  readonly Provider = NodeProvider;
  readonly Control = Controls;

  provider: NodeProvider;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService,
    wizard: WizardService
  ) {
    super(wizard, 'Provider settings');
  }

  ngOnInit(): void {
    this._init();

    this.provider = this._clusterSpecService.provider;

    this._clusterSpecService.providerChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => (this.provider = provider));
  }

  hasExtendedSection(provider: NodeProvider): boolean {
    return [
      NodeProvider.VSPHERE,
      NodeProvider.AWS,
      NodeProvider.AZURE,
      NodeProvider.GCP,
      NodeProvider.OPENSTACK,
      NodeProvider.HETZNER,
      NodeProvider.NUTANIX,
      NodeProvider.VMWARECLOUDDIRECTOR,
    ].includes(provider);
  }

  private _init(): void {
    this.form = this._builder.group({
      [Controls.Preset]: this._builder.control(''),
      [Controls.ProviderBasic]: this._builder.control(''),
      [Controls.ProviderExtended]: this._builder.control(''),
    });
  }
}
