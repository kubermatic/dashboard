import {Component, OnInit} from '@angular/core';
import {EMPTY, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../core/services';
import {PresetListEntity} from '../../../shared/entity/provider/credentials/PresetListEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';

export enum PresetsState {
  Ready = 'Custom Preset',
  Loading = 'Loading...',
  Empty = 'No Presets available'
}

@Component({
  selector: 'kubermatic-custom-presets-settings',
  templateUrl: './custom-presets.component.html',
  styleUrls: ['./custom-presets.component.scss'],
})
export class CustomPresetsSettingsComponent implements OnInit {
  presetList = new PresetListEntity();
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
        .pipe(switchMap(
            providerForm => providerForm.provider === NodeProvider.BRINGYOUROWN || !providerForm.provider ?
                EMPTY :
                this._wizard.presets(providerForm.provider)))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(presetList => {
          this.presetsLoaded = presetList.names ? presetList.names.length > 0 : false;
          this._state = this.presetsLoaded ? PresetsState.Ready : PresetsState.Empty;
          this.presetList = presetList;
        });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => this._selectedPreset = preset);

    this._wizard.onCustomPresetsDisable.pipe(takeUntil(this._unsubscribe))
        .subscribe(disable => this._disabled = disable);
  }
}
