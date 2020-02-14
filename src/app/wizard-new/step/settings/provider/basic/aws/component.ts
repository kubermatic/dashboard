import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {NewWizardService, PresetsService} from '../../../../../../core/services';
import {AWSCloudSpec} from '../../../../../../shared/entity/cloud/AWSCloudSpec';
import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';

export enum Controls {
  AccessKeyID = 'accessKeyId',
  SecretAccessKey = 'secretAccessKey',
}

@Component({
  selector: 'kubermatic-wizard-aws-provider-basic',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AWSProviderBasicComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AWSProviderBasicComponent), multi: true}
  ]
})
export class AWSProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly controls = Controls;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _wizard: NewWizardService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AccessKeyID]: new FormControl('', Validators.required),
      [Controls.SecretAccessKey]: new FormControl('', Validators.required),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._presets.enablePresets(
          Object.values(Controls).every(control => !this._wizard.cluster.spec.cloud.aws[control]));
      this._wizard.cluster = this._getClusterEntity();
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));
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
          aws: {
            accessKeyId: this.form.get(Controls.AccessKeyID).value,
            secretAccessKey: this.form.get(Controls.SecretAccessKey).value,
          } as AWSCloudSpec
        } as CloudSpec
      } as ClusterSpec
    } as ClusterEntity;
  }
}
