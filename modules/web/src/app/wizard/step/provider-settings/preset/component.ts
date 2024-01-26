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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {Cluster} from '@shared/entity/cluster';
import {Preset, SimplePresetList} from '@shared/entity/preset';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {switchMap, takeUntil} from 'rxjs/operators';

export enum Controls {
  Preset = 'name',
}

export enum PresetsState {
  Ready = 'Provider Preset',
  Loading = 'Loading...',
  Empty = 'No Provider Presets available',
}

@Component({
  selector: 'km-wizard-presets',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PresetsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PresetsComponent),
      multi: true,
    },
  ],
})
export class PresetsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  presetList = new SimplePresetList();
  presetDetailedList: Preset[] = [];
  presetsLoaded = false;

  readonly Controls = Controls;

  private _state = PresetsState.Loading;

  constructor(
    private readonly _presets: PresetsService,
    private readonly _builder: FormBuilder,
    private readonly _projectService: ProjectService,
    private readonly _clusterSpecService: ClusterSpecService
  ) {
    super('Preset');
  }

  get label(): string {
    return this._state;
  }

  get selectedPreset(): string {
    return this._presets.preset;
  }

  set selectedPreset(preset: string) {
    this.form.get(Controls.Preset).setValue(preset);
    if (!preset) {
      this.form.get(Controls.Preset).reset();
    }

    this._presets.preset = preset;
    this._presets.presetDetailed = this.presetDetailedList.find(p => p.name === preset);
    this._clusterSpecService.cluster = {credential: preset} as Cluster;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Preset]: new FormControl('', Validators.required),
    });

    this._clusterSpecService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this.reset());

    this._clusterSpecService.datacenterChanges
      .pipe(
        switchMap(dc =>
          this._presets.presets(
            false,
            false,
            this._clusterSpecService.provider,
            dc,
            this._projectService.selectedProjectID
          )
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(presetList => {
        this.reset();
        this.presetDetailedList = presetList.items;
        this.presetList = new SimplePresetList(...presetList.items.map(preset => preset.name));
        this.presetsLoaded = this.presetList.names ? !_.isEmpty(this.presetList.names) : false;
        this._state = this.presetsLoaded ? PresetsState.Ready : PresetsState.Empty;
        this._enable(this._state !== PresetsState.Empty, Controls.Preset);
      });

    this.form
      .get(Controls.Preset)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => {
        this._presets.preset = preset;
        this._presets.presetDetailed = this.presetDetailedList.find(p => p.name === preset);
        this._clusterSpecService.cluster = {credential: preset} as Cluster;
      });

    this._presets.presetStatusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(enable => {
      if (this._state !== PresetsState.Empty) {
        this._enable(enable, Controls.Preset);
      }
    });
  }

  reset(): void {
    this.selectedPreset = '';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
