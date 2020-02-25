import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {switchMap, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {PresetListEntity} from '../../../../shared/entity/provider/credentials/PresetListEntity';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {WizardService} from '../../../service/wizard';

export enum Controls {
  Preset = 'name',
}

export enum PresetsState {
  Ready = 'Preset',
  Loading = 'Loading...',
  Empty = 'No Presets available'
}

@Component({
  selector: 'kubermatic-wizard-presets',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PresetsComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => PresetsComponent), multi: true}
  ],
})
export class PresetsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  presetList = new PresetListEntity();
  presetsLoaded = false;

  readonly Controls = Controls;

  private _state = PresetsState.Loading;

  get label(): string {
    return this._state;
  }

  get selectedPreset(): string {
    return this._presets.preset;
  }

  set selectedPreset(preset: string) {
    this.form.get(Controls.Preset).setValue(preset);
    this._presets.preset = preset;
  }

  constructor(
      private readonly _presets: PresetsService, private readonly _builder: FormBuilder,
      private readonly _wizard: WizardService) {
    super('Preset');
  }

  ngOnInit(): void {
    this.form = this._builder.group({[Controls.Preset]: new FormControl('', Validators.required)});

    this._wizard.datacenterChanges.pipe(switchMap(dc => this._presets.presets(this._wizard.provider, dc)))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(presetList => {
          this.reset();
          this.presetsLoaded = presetList.names ? presetList.names.length > 0 : false;
          this._state = this.presetsLoaded ? PresetsState.Ready : PresetsState.Empty;
          this.presetList = presetList;
          this._enable(this._state !== PresetsState.Empty, Controls.Preset);
        });

    this.form.get(Controls.Preset).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this._presets.preset = preset;
    });

    this._presets.presetStatusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(enable => {
      if (this._state !== PresetsState.Empty) {
        this._enable(enable, Controls.Preset);
      }
    });
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  reset(): void {
    this.selectedPreset = '';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
