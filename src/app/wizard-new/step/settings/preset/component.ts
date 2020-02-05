import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {NewWizardService, PresetsService} from '../../../../core/services';
import {PresetListEntity} from '../../../../shared/entity/provider/credentials/PresetListEntity';

export enum PresetsState {
  Ready = 'Preset',
  Loading = 'Loading...',
  Empty = 'No Presets available'
}

@Component({
  selector: 'kubermatic-wizard-presets',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class PresetsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  presetList = new PresetListEntity();
  presetsLoaded = false;

  readonly Controls = Presets.Controls;

  private _unsubscribe = new Subject<void>();
  private _state = PresetsState.Loading;

  get label(): string {
    return this._state;
  }

  get selectedPreset(): string {
    return this._wizard.preset;
  }

  set selectedPreset(preset: string) {
    this.form.get(Presets.Controls.Preset).setValue(preset);
    this._wizard.preset = preset;
  }

  constructor(
      private readonly _presets: PresetsService, private readonly _builder: FormBuilder,
      private readonly _wizard: NewWizardService) {}

  ngOnInit(): void {
    this.form = this._builder.group({[Presets.Controls.Preset]: new FormControl('', Validators.required)});

    this._wizard.providerChanges.pipe(switchMap(provider => this._presets.presets(provider)))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(presetList => {
          this._reset();

          this.presetsLoaded = presetList.names ? presetList.names.length > 0 : false;
          this._state = this.presetsLoaded ? PresetsState.Ready : PresetsState.Empty;
          this.presetList = presetList;
        });

    this._wizard.datacenterChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._reset());

    this.form.get(Presets.Controls.Preset).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this._wizard.preset = preset;
    });

    this._wizard.presetStatusChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(enable => this._enable(enable, Presets.Controls.Preset));
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _reset(): void {
    this.selectedPreset = undefined;
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}

export namespace Presets {
  export enum Controls {
    Preset = 'preset',
  }
}
