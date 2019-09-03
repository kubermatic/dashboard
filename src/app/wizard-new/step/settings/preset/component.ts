import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {PresetListEntity} from '../../../../shared/entity/provider/credentials/PresetListEntity';
import {StepBase} from '../../base';

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
export class PresetsComponent extends StepBase implements OnInit, OnDestroy {
  @Input('baseForm') private readonly _baseForm: FormGroup;

  readonly Controls = Presets.Controls;

  presetList = new PresetListEntity();
  presetsLoaded = false;

  private _unsubscribe = new Subject<void>();
  private _state = PresetsState.Loading;

  get label(): string {
    return this._state;
  }

  get selectedPreset(): string {
    return this._wizard.preset;
  }

  set selectedPreset(preset: string) {
    this.control(Presets.Controls.Preset).setValue(preset);
    this._wizard.preset = preset;
  }

  constructor(private readonly _presets: PresetsService, private readonly _builder: FormBuilder) {
    super(Presets.Controls);
  }

  ngOnInit(): void {
    this.form = this._baseForm;
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

    this.control(Presets.Controls.Preset).valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this._wizard.preset = preset;
    });

    this._wizard.presetStatusChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(enable => this.enable(enable, Presets.Controls.Preset));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _reset(): void {
    this.selectedPreset = undefined;
  }
}

export namespace Presets {
  export enum Controls {
    Preset = 'preset',
  }
}
