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
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {SimplePresetList} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {ExternalClusterService} from '@core/services/external-cluster';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {ProjectService} from '@core/services/project';

export enum Controls {
  Preset = 'name',
}

export enum PresetsState {
  Ready = 'Provider Preset',
  Loading = 'Loading...',
  Empty = 'No Provider Presets available',
}

@Component({
    selector: 'km-credentials-presets',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CredentialsPresetsComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => CredentialsPresetsComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class CredentialsPresetsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  presetList = new SimplePresetList();
  presetsLoaded = false;
  selectedProvider: ExternalClusterProvider;
  private _state = PresetsState.Loading;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _projectService: ProjectService
  ) {
    super('Preset');
  }

  get label(): string {
    return this._state;
  }

  get selectedPreset(): string {
    return this._externalClusterService.preset;
  }

  set selectedPreset(preset: string) {
    this.form.get(Controls.Preset).setValue(preset);
    if (!preset) {
      this.form.get(Controls.Preset).reset();
    }

    this._externalClusterService.preset = preset;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Preset]: new FormControl('', Validators.required),
    });

    this._externalClusterService.providerChanges
      .pipe(
        filter(provider => !!provider),
        tap(provider => {
          if (provider !== this.selectedProvider) {
            this.selectedProvider = provider;
            this.reset();
          }
        }),
        switchMap(provider =>
          this._externalClusterService.getPresets(this._projectService.selectedProjectID, provider)
        ),
        map(presetList => new SimplePresetList(...presetList.items.map(preset => preset.name))),
        takeUntil(this._unsubscribe)
      )
      .subscribe(presetList => {
        this.reset();
        this.presetsLoaded = presetList.names ? !_.isEmpty(presetList.names) : false;
        this._state = this.presetsLoaded ? PresetsState.Ready : PresetsState.Empty;
        this.presetList = presetList;
        this._enable(this._state !== PresetsState.Empty, Controls.Preset);
      });

    this.form
      .get(Controls.Preset)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => (this._externalClusterService.preset = preset));

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._externalClusterService.credentialsStepValidity = this.form.valid));

    this._externalClusterService.presetStatusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(enable => {
      if (this._state !== PresetsState.Empty) {
        this._enable(enable, Controls.Preset);
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  reset(): void {
    this.selectedPreset = '';
  }

  private _enable(enable: boolean, name: Controls): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}
