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
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Mode} from '@app/settings/admin/presets/dialog/component';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {ANEXIA_DEPRECATED_MESSAGE} from '@app/shared/constants/common';
import {DatacenterService} from '@core/services/datacenter';
import {AutocompleteControls, AutocompleteInitialState} from '@shared/components/autocomplete/component';
import {Datacenter} from '@shared/entity/datacenter';
import {PresetModel} from '@shared/entity/preset';
import {EXTERNAL_NODE_PROVIDERS, NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {distinctUntilChanged, filter, map, switchMap, takeUntil} from 'rxjs/operators';

enum Controls {
  Settings = 'settings',
  Datacenter = 'datacenter',
  IsCustomizable = 'isCustomizable',
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
  standalone: false,
})
export class PresetSettingsStepComponent extends BaseFormValidator implements OnInit {
  @Input() mode: Mode;
  form: FormGroup;
  provider: NodeProvider;
  datacenters: string[] = [];
  isLoadingDatacenters = true;
  preset: PresetModel;

  readonly Providers = NodeProvider;
  readonly Controls = Controls;
  readonly Mode = Mode;
  readonly ANEXIA_DEPRECATED_MESSAGE = ANEXIA_DEPRECATED_MESSAGE;

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
      [Controls.IsCustomizable]: this._builder.control(false),
    });

    this._presetDialogService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(provider => {
      this.provider = provider;
      this.form.removeControl(Controls.Settings);
      this.form.addControl(Controls.Settings, this._builder.control(''));
      this.form.get(Controls.Datacenter).setValue(AutocompleteInitialState);
      this.form.get(Controls.IsCustomizable).setValue(false);
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

    this.form
      .get(Controls.Datacenter)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(filter(form => !!form))
      .pipe(map(form => form[AutocompleteControls.Main]))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenter => this._updateDatacenter(datacenter));

    this.form
      .get(Controls.IsCustomizable)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => this._updateIsEditable(value));
  }

  isExternal(): boolean {
    return EXTERNAL_NODE_PROVIDERS.includes(this.provider);
  }

  isProvider(...provider: NodeProvider[]): boolean {
    return provider.includes(this.provider);
  }

  private _filterByProvider(datacenters: Datacenter[]): string[] {
    return datacenters.filter(dc => dc.spec.provider === this.provider).map(dc => dc.metadata.name);
  }

  private _updateDatacenter(datacenter: string): void {
    this._presetDialogService.preset.spec[this._presetDialogService.provider].datacenter = datacenter;
  }

  private _updateIsEditable(value: boolean): void {
    this._presetDialogService.preset.spec[this._presetDialogService.provider].isCustomizable = value;
  }
}
