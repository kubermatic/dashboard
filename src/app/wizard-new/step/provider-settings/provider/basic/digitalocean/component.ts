import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {PresetsService} from '../../../../../../core/services';
 import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';
import {WizardService} from '../../../../../service/wizard';
import {DigitaloceanCloudSpec} from "../../../../../../shared/entity/cloud/DigitaloceanCloudSpec";

export enum Controls {
  Token = 'token',
}

@Component({
  selector: 'kubermatic-wizard-digitalocean-provider-basic',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DigitalOceanProviderBasicComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => DigitalOceanProviderBasicComponent), multi: true}
  ]
})
export class DigitalOceanProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly controls = Controls;

  protected readonly _debounceTime = 250;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _wizard: WizardService, private readonly _clusterService: ClusterService) {
    super('DigitalOcean Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Token]: this._builder.control('', Validators.required),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => this._presets.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value)));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.get(Controls.Token).valueChanges
        .pipe(debounceTime(this._debounceTime))
        .pipe(distinctUntilChanged())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._clusterService.cluster = this._getClusterEntity());

    merge(this._wizard.providerChanges, this._wizard.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this.form.reset());
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
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

  private _getClusterEntity(): ClusterEntity {
    return {
      spec: {
        cloud: {
          digitalocean: {
            token: this.form.get(Controls.Token).value,
          } as DigitaloceanCloudSpec
        } as CloudSpec
      } as ClusterSpec
    } as ClusterEntity;
  }
}
