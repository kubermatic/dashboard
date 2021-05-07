// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {ClusterService} from '@core/services/cluster';
import {ProviderSettingsPatch} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-alibaba-provider-settings',
  templateUrl: './template.html',
})
export class AlibabaProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;

  private readonly _debounceTime = 1000;
  private _formData = {accessKeyID: '', accessKeySecret: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      accessKeyID: new FormControl(''),
      accessKeySecret: new FormControl(''),
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (
          data.accessKeyID !== this._formData.accessKeyID ||
          data.accessKeySecret !== this._formData.accessKeySecret
        ) {
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
