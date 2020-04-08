import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {PresetsService} from '../../../../../../core/services';
import {VSphereCloudSpec} from '../../../../../../shared/entity/cloud/VSphereCloudSpec';
import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

export enum Controls {
  InfraManagementUsername = 'infraManagementUsername',
  InfraManagementPassword = 'infraManagementPassword',
  Username = 'username',
  Password = 'password',
  UseCustomCloudCredentials = 'useCustomCloudCredentials',
}

@Component({
  selector: 'km-wizard-vsphere-provider-basic',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => VSphereProviderBasicComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => VSphereProviderBasicComponent), multi: true}
  ]
})
export class VSphereProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly controls = Controls;

  protected readonly _debounceTime = 250;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _clusterService: ClusterService) {
    super('VMWare Provider Basic');
  }

  get useCustomCloudCredentials(): boolean {
    return this.form.get(Controls.UseCustomCloudCredentials).value;
  }

  private get _cloudUsername(): string {
    return this.form.get(Controls.Username).value ? this.form.get(Controls.Username).value :
                                                    this.form.get(Controls.InfraManagementUsername).value;
  }

  private get _cloudPassword(): string {
    return this.form.get(Controls.Password).value ? this.form.get(Controls.Password).value :
                                                    this.form.get(Controls.InfraManagementPassword).value;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InfraManagementUsername]: this._builder.control('', Validators.required),
      [Controls.InfraManagementPassword]: this._builder.control('', Validators.required),
      [Controls.Username]: this._builder.control(''),
      [Controls.Password]: this._builder.control(''),
      [Controls.UseCustomCloudCredentials]: this._builder.control(false),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => this._presets.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value)));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.get(Controls.UseCustomCloudCredentials)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(this._handleCloudCredentials.bind(this));

    merge(
        this.form.get(Controls.InfraManagementUsername).valueChanges,
        this.form.get(Controls.InfraManagementPassword).valueChanges,
        this.form.get(Controls.Username).valueChanges,
        this.form.get(Controls.Password).valueChanges,
        this.form.get(Controls.UseCustomCloudCredentials).valueChanges,
        )
        .pipe(debounceTime(this._debounceTime))
        .pipe(distinctUntilChanged())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._clusterService.cluster = this._getClusterEntity());

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this.form.reset());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _handleCloudCredentials(selected: boolean): void {
    if (!selected) {
      this.form.get(Controls.Username).clearValidators();
      this.form.get(Controls.Password).clearValidators();
    } else {
      this.form.get(Controls.Username).setValidators(Validators.required);
      this.form.get(Controls.Password).setValidators(Validators.required);
    }

    this.form.get(Controls.Username).setValue('');
    this.form.get(Controls.Password).setValue('');
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
          vsphere: {
            username: this._cloudUsername,
            password: this._cloudPassword,
            infraManagementUser: {
              username: this.form.get(Controls.InfraManagementUsername).value,
              password: this.form.get(Controls.InfraManagementPassword).value,
            },
          } as VSphereCloudSpec
        } as CloudSpec
      } as ClusterSpec
    } as ClusterEntity;
  }
}
