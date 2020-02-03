import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../../../app-config.service';
import {ApiService} from '../../../core/services';
import {ClusterNameGenerator} from '../../../core/util/name-generator.service';
import {MasterVersion} from '../../../shared/entity/ClusterEntity';
import {ClusterType} from '../../../shared/utils/cluster-utils/cluster-utils';
import {StepBase} from '../base';

enum Controls {
  Name = 'name',
  Version = 'version',
  Type = 'type',
}

@Component({
  selector: 'kubermatic-wizard-cluster-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ClusterStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => ClusterStepComponent), multi: true}
  ]
})
export class ClusterStepComponent extends StepBase implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  masterVersions: MasterVersion[] = [];

  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(
      private readonly _builder: FormBuilder, private readonly _api: ApiService,
      private readonly _appConfig: AppConfigService, private readonly _nameGenerator: ClusterNameGenerator) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: new FormControl(
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.pattern('[a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*'),
          ]),
      [Controls.Version]: new FormControl('', [Validators.required]),
      [Controls.Type]: new FormControl(''),
    });

    this._setDefaultClusterType();
    this._wizard.clusterType = this.control(Controls.Type).value as ClusterType;

    this._api.getMasterVersions(this.controlValue(Controls.Type))
        .pipe(first())
        .subscribe(this._setDefaultVersion.bind(this));

    this.control(Controls.Type)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap((type: ClusterType) => {
          this.masterVersions = [];
          this.control(Controls.Version).reset();
          this._wizard.clusterType = type;

          return this._api.getMasterVersions(this.controlValue(Controls.Type) as ClusterType);
        }))
        .subscribe(this._setDefaultVersion.bind(this));
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  hasMultipleTypes(): boolean {
    return Object.values(ClusterType).every(type => !this._appConfig.getConfig()[`hide_${type}`]);
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(_: any): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }

  validate(control: AbstractControl): ValidationErrors|null {
    return this.form.valid ? null : {invalidForm: {valid: false, message: 'Cluster step form fields are invalid'}};
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _setDefaultVersion(versions: MasterVersion[]): void {
    this.masterVersions = versions;
    for (const version of versions) {
      if (version.default) {
        this.control(Controls.Version).setValue(version.version);
      }
    }
  }

  private _setDefaultClusterType(): void {
    if (this.controlValue(Controls.Type)) {
      return;
    }

    if (this._isClusterTypeVisible(ClusterType.Kubernetes)) {
      this.control(Controls.Type).setValue(ClusterType.Kubernetes);
      return;
    }

    if (this._isClusterTypeVisible(ClusterType.OpenShift)) {
      this.control(Controls.Type).setValue(ClusterType.OpenShift);
    }
  }

  private _isClusterTypeVisible(type: ClusterType): boolean {
    return !this._appConfig.getConfig()[`hide_${type}`];
  }
}
