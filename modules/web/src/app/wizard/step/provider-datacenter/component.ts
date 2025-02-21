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
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validator,
  Validators,
} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {WizardService} from '@core/services/wizard/wizard';
import {DatacenterService} from '@core/services/datacenter';
import {Datacenter, getDatacenterProvider} from '@shared/entity/datacenter';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {filter, switchMap, takeUntil} from 'rxjs/operators';
import {StepBase} from '../base';

enum Controls {
  Provider = 'provider',
  Datacenter = 'datacenter',
}

@Component({
  selector: 'km-wizard-provider-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProviderStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ProviderStepComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class ProviderStepComponent extends StepBase implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  providers: NodeProvider[] = [];
  datacenters: Datacenter[] = [];

  readonly controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _dcService: DatacenterService,
    private readonly _clusterSpecService: ClusterSpecService,
    wizard: WizardService
  ) {
    super(wizard);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
      [Controls.Datacenter]: new FormControl('', [Validators.required]),
    });

    this._dcService.datacenters.pipe(takeUntil(this._unsubscribe)).subscribe(datacenters => {
      this.providers = [...new Set(datacenters.map(dataCenter => getDatacenterProvider(dataCenter)).filter(Boolean))];
    });

    this.control(Controls.Provider)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((provider: NodeProvider) => {
        this.form.get(Controls.Datacenter).setValue('');
        this._wizard.provider = provider;
      });

    this._clusterSpecService.providerChanges
      .pipe(switchMap(_ => this._dcService.datacenters))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenters => {
        const providerDatacenters: Datacenter[] = [];
        for (const datacenter of datacenters) {
          const provider = getDatacenterProvider(datacenter);
          const clusterProvider = this._clusterSpecService.provider;
          if (provider === clusterProvider) {
            providerDatacenters.push(datacenter);
          }
        }

        this.datacenters = providerDatacenters;
      });

    this.control(Controls.Datacenter)
      .valueChanges // Allow only non-empty values
      .pipe(filter(value => value))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenter => (this._clusterSpecService.datacenter = datacenter));
  }

  getLocation(datacenter: Datacenter): string {
    let location = datacenter.spec.location;
    let idx = location.indexOf('(');

    location = location.substring(0, idx > -1 ? idx : undefined);

    idx = location.includes(' - ') ? location.indexOf('-') : -1;
    location = location.substring(0, idx > -1 ? idx : undefined);

    location = location.replace('Azure', '');
    return location.trim();
  }

  getZone(datacenter: Datacenter): string {
    let location = datacenter.spec.location;
    let idx = location.indexOf('(');

    location = idx > -1 ? location.substring(idx + 1).replace(')', '') : location;

    idx = location.includes(' - ') ? location.indexOf('-') : -1;
    location = idx > -1 ? location.substring(idx + 1) : location;

    return location === datacenter.spec.location ? '' : location.trim();
  }

  trackByDatacenter(_: number, datacenter: Datacenter): string {
    return datacenter.metadata.name;
  }
}
