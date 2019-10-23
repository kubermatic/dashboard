import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'kubermatic-aws-provider-settings',
  templateUrl: './aws-provider-settings.component.html',
})

export class AWSProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private _formData = {accessKeyId: '', secretAccessKey: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      accessKeyId: new FormControl(''),
      secretAccessKey: new FormControl(''),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.accessKeyId !== this._formData.accessKeyId || data.secretAccessKey !== this._formData.secretAccessKey) {
        this._formData = data;
        this.setValidators();
        this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
      }
    });
  }

  get accessKeyId(): AbstractControl {
    return this.form.controls.accessKeyId;
  }

  get secretAccessKey(): AbstractControl {
    return this.form.controls.secretAccessKey;
  }

  setValidators(): void {
    if (!this.accessKeyId.value && !this.secretAccessKey.value) {
      this.form.controls.accessKeyId.clearValidators();
      this.form.controls.secretAccessKey.clearValidators();
    } else {
      this.accessKeyId.setValidators([Validators.required]);
      this.secretAccessKey.setValidators([Validators.required]);
    }

    this.form.controls.accessKeyId.updateValueAndValidity();
    this.form.controls.secretAccessKey.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.accessKeyId.value && !this.secretAccessKey.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        aws: {
          accessKeyId: this.form.controls.accessKeyId.value,
          secretAccessKey: this.form.controls.secretAccessKey.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
