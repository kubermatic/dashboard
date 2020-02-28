import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'kubermatic-alibaba-provider-settings',
  templateUrl: './alibaba-provider-settings.component.html',
})

export class AlibabaProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private _formData = {accessKeyID: '', accessKeySecret: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      accessKeyID: new FormControl(''),
      accessKeySecret: new FormControl(''),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.accessKeyID !== this._formData.accessKeyID || data.accessKeySecret !== this._formData.accessKeySecret) {
        this._formData = data;
        this.setValidators();
        this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
      }
    });
  }

  get accessKeyID(): AbstractControl {
    return this.form.controls.accessKeyID;
  }

  get accessKeySecret(): AbstractControl {
    return this.form.controls.accessKeySecret;
  }

  setValidators(): void {
    if (!this.accessKeyID.value && !this.accessKeySecret.value) {
      this.accessKeyID.clearValidators();
      this.accessKeySecret.clearValidators();
    } else {
      this.accessKeyID.setValidators([Validators.required]);
      this.accessKeySecret.setValidators([Validators.required]);
    }

    this.accessKeyID.updateValueAndValidity();
    this.accessKeySecret.updateValueAndValidity();
  }

  addRequiredIndicator(): string {
    return !this.accessKeyID.value && !this.accessKeySecret.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        alibaba: {
          accessKeyID: this.form.controls.accessKeyID.value,
          accessKeySecret: this.form.controls.accessKeySecret.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
