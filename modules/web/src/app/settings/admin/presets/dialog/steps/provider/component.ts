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

import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {Mode} from '@app/settings/admin/presets/dialog/component';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {DatacenterService} from '@core/services/datacenter';
import {PresetProvider} from '@shared/entity/preset';
import {EXTERNAL_NODE_PROVIDERS, NodeProvider, NodeProviderConstants} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Provider = 'provider',
}

const UNSUPPORTED_PROVIDERS = [NodeProvider.BRINGYOUROWN];

@Component({
    selector: 'km-preset-provider-step',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PresetProviderStepComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PresetProviderStepComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class PresetProviderStepComponent extends BaseFormValidator implements OnInit {
  @Input() existingProviders: PresetProvider[] = [];
  @Input() mode: Mode = Mode.Add;

  providers: NodeProvider[] = [];
  form: FormGroup;

  readonly controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _datacenterService: DatacenterService,
    private readonly _presetDialogService: PresetDialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
    });

    this.existingProviders = this.existingProviders || [];

    if (this.mode === Mode.Edit) {
      this.providers = this.existingProviders.map(p => p.name);
    } else {
      this._datacenterService.datacenters.pipe(takeUntil(this._unsubscribe)).subscribe(dc => {
        const providers = [
          ..._.uniq(dc.map(dc => NodeProviderConstants.newNodeProvider(dc.spec.provider))),
          ...EXTERNAL_NODE_PROVIDERS,
        ];
        const existingProviders = this.existingProviders.map(e => e.name);
        this.providers = providers.filter(p => !existingProviders.includes(p) && !UNSUPPORTED_PROVIDERS.includes(p));
      });
    }

    this.form
      .get(Controls.Provider)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => {
        this.form.updateValueAndValidity();
        this._presetDialogService.provider = provider;
      });
  }
}
