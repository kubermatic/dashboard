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

import {Component, Input, OnInit} from '@angular/core';
import {EMPTY, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {PresetList} from '../../../shared/entity/preset';

export enum PresetsState {
  Ready = 'Custom Preset',
  Loading = 'Loading...',
  Empty = 'No Presets available',
}

@Component({
  selector: 'km-custom-presets-settings',
  templateUrl: './custom-presets.component.html',
  styleUrls: ['./custom-presets.component.scss'],
})
export class CustomPresetsSettingsComponent implements OnInit {
  @Input() cluster: Cluster;
  presetList = new PresetList();
  presetsLoaded = false;

  private _disabled = false;
  private _selectedPreset: string;
  private _unsubscribe = new Subject<void>();
  private _state = PresetsState.Loading;

  get selectedPreset(): string {
    return this._selectedPreset;
  }

  set selectedPreset(newVal: string) {
    this._wizard.selectCustomPreset(newVal);
    this._selectedPreset = newVal;
  }

  get label(): string {
    return this._state;
  }

  get disabled(): boolean {
    return !this.presetsLoaded || this._disabled;
  }

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this._wizard.clusterProviderFormChanges$
      .pipe(
        switchMap(providerForm =>
          providerForm.provider === NodeProvider.BRINGYOUROWN || !providerForm.provider
            ? EMPTY
            : this._wizard.presets(providerForm.provider, this.cluster.spec.cloud.dc)
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(presetList => {
        this.presetsLoaded = presetList.names ? presetList.names.length > 0 : false;
        this._state = this.presetsLoaded ? PresetsState.Ready : PresetsState.Empty;
        this.presetList = presetList;
      });

    this._wizard.onCustomPresetSelect
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => (this._selectedPreset = preset));

    this._wizard.onCustomPresetsDisable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(disable => (this._disabled = disable));
  }
}
