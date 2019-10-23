import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'kubermatic-azure-provider-settings',
  templateUrl: './azure-provider-settings.component.html',
})

export class AzureProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private _formData = {clientID: '', clientSecret: '', subscriptionID: '', tenantID: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      clientID: new FormControl(''),
      clientSecret: new FormControl(''),
      subscriptionID: new FormControl(''),
      tenantID: new FormControl(''),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.clientID !== this._formData.clientID || data.clientSecret !== this._formData.clientSecret ||
          data.subscriptionID !== this._formData.subscriptionID || data.tenantID !== this._formData.tenantID) {
        this._formData = data;
        this.setValidators();
        this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
      }
    });
  }

  get clientID(): AbstractControl {
    return this.form.controls.clientID;
  }

  get clientSecret(): AbstractControl {
    return this.form.controls.clientSecret;
  }

  get subscriptionID(): AbstractControl {
    return this.form.controls.subscriptionID;
  }

  get tenantID(): AbstractControl {
    return this.form.controls.tenantID;
  }

  setValidators(): void {
    if (!this.clientID.value && !this.clientSecret.value && !this.subscriptionID.value && !this.tenantID.value) {
      this.form.controls.clientID.clearValidators();
      this.form.controls.clientSecret.clearValidators();
      this.form.controls.subscriptionID.clearValidators();
      this.form.controls.tenantID.clearValidators();
    } else {
      this.clientID.setValidators([Validators.required]);
      this.clientSecret.setValidators([Validators.required]);
      this.subscriptionID.setValidators([Validators.required]);
      this.tenantID.setValidators([Validators.required]);
    }

    this.form.controls.clientID.updateValueAndValidity();
    this.form.controls.clientSecret.updateValueAndValidity();
    this.form.controls.subscriptionID.updateValueAndValidity();
    this.form.controls.tenantID.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.clientID.value && !this.clientSecret.value && !this.subscriptionID.value && !this.tenantID.value ? '' :
                                                                                                                    '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        azure: {
          clientID: this.form.controls.clientID.value,
          clientSecret: this.form.controls.clientSecret.value,
          subscriptionID: this.form.controls.subscriptionID.value,
          tenantID: this.form.controls.tenantID.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
