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

import {Component, forwardRef, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {DatacenterService} from '@core/services/datacenter';
import {Datacenter} from '@shared/entity/datacenter';
import {EXTERNAL_NODE_PROVIDERS, NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge} from 'rxjs';
import {distinctUntilChanged, map, switchMap, takeUntil} from 'rxjs/operators';
import {AutocompleteInitialState} from '@shared/components/autocomplete/component';
import {PresetModel} from '@shared/entity/preset';

enum Controls {
  Settings = 'settings',
  Datacenter = 'datacenter',
}

@Component({
  selector: 'km-preset-settings-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PresetSettingsStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PresetSettingsStepComponent),
      multi: true,
    },
  ],
})
export class PresetSettingsStepComponent extends BaseFormValidator implements OnInit {
  form: FormGroup;
  provider: NodeProvider;
  datacenters: string[] = [];
  isLoadingDatacenters = true;
  preset: PresetModel;

  readonly Providers = NodeProvider;
  readonly Controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presetDialogService: PresetDialogService,
    private readonly _datacenterService: DatacenterService
  ) {
    super();
  }

  ngOnInit(): void {
    this.preset = this._presetDialogService.preset;

    this.form = this._builder.group({
      [Controls.Settings]: this._builder.control(''),
      [Controls.Datacenter]: this._builder.control(''),
    });

    this._presetDialogService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(provider => {
      this.provider = provider;
      this.form.removeControl(Controls.Settings);
      this.form.addControl(Controls.Settings, this._builder.control(''));
      this.form.get(Controls.Datacenter).setValue(AutocompleteInitialState);
      this.form.updateValueAndValidity();
    });

    this._presetDialogService.providerChanges
      .pipe(switchMap(_ => this._datacenterService.datacenters))
      .pipe(map(datacenters => this._filterByProvider(datacenters)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: datacenters => {
          this.datacenters = datacenters;
          this.isLoadingDatacenters = false;
        },
        complete: () => {
          this.isLoadingDatacenters = false;
        },
      });

    merge(this.form.get(Controls.Datacenter).valueChanges)
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._update());
  }

  private _filterByProvider(datacenters: Datacenter[]): string[] {
    return datacenters.filter(dc => dc.spec.provider === this.provider).map(dc => dc.metadata.name);
  }

  private _update(): void {
    this._presetDialogService.preset.spec[this._presetDialogService.provider].datacenter = this.form.get(
      Controls.Datacenter
    ).value;
  }

  isExternal(): boolean {
    return EXTERNAL_NODE_PROVIDERS.includes(this.provider);
  }
}
