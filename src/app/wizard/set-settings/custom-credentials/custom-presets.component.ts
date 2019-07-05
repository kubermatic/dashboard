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
  private _selectedPresets: string;
  private _unsubscribe = new Subject<void>();
  private _state = PresetsState.Loading;

  get selectedPresets() {
    return this._selectedPresets;
  }

  set selectedPresets(newVal: string) {
    this._wizard.selectCustomPreset(newVal);
    this._selectedPresets = newVal;
  }

  get label() {
    return this._state;
  }

  get disabled() {
    return !this.presetsLoaded || this._disabled;
  }

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit() {
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

    this._wizard.onCustomPresetsDisable.pipe(takeUntil(this._unsubscribe))
        .subscribe(disable => this._disabled = disable);
  }
}
