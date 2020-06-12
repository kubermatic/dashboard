import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {switchMap, takeUntil} from 'rxjs/operators';

import {PresetsService} from '../../../../core/services';
import {Cluster} from '../../../../shared/entity/cluster';
import {PresetListEntity} from '../../../../shared/entity/provider/credentials/PresetListEntity';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../service/cluster';

export enum Controls {
  Preset = 'name',
}

export enum PresetsState {
  Ready = 'Preset',
  Loading = 'Loading...',
  Empty = 'No Presets available',
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
    this._clusterService.cluster = {credential: preset} as Cluster;
  }

  constructor(
    private readonly _presets: PresetsService,
    private readonly _builder: FormBuilder,
    private readonly _clusterService: ClusterService
  ) {
    super('Preset');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Preset]: new FormControl('', Validators.required),
    });

    this._clusterService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this.reset());

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._presets.presets(this._clusterService.provider, dc)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(presetList => {
        this.reset();
        this.presetsLoaded = presetList.names ? presetList.names.length > 0 : false;
        this._state = this.presetsLoaded ? PresetsState.Ready : PresetsState.Empty;
        this.presetList = presetList;
        this._enable(this._state !== PresetsState.Empty, Controls.Preset);
      });

    this.form
      .get(Controls.Preset)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => {
        this._presets.preset = preset;
        this._clusterService.cluster = {credential: preset} as Cluster;
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
