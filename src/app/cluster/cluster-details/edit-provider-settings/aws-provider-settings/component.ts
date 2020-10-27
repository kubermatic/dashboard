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
import {ClusterService} from '@core/services/cluster/cluster.service';
import {ProviderSettingsPatch} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-aws-provider-settings',
  templateUrl: './template.html',
})
export class AWSProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;

  private readonly _debounceTime = 1000;
  private _formData = {accessKeyId: '', secretAccessKey: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  get accessKeyId(): AbstractControl {
    return this.form.controls.accessKeyId;
  }

  get secretAccessKey(): AbstractControl {
    return this.form.controls.secretAccessKey;
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      accessKeyId: new FormControl(''),
      secretAccessKey: new FormControl(''),
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (
          data.accessKeyId !== this._formData.accessKeyId ||
          data.secretAccessKey !== this._formData.secretAccessKey
        ) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
        }
      });
  }

  setValidators(): void {
    if (!this.accessKeyId.value && !this.secretAccessKey.value) {
      this.accessKeyId.clearValidators();
      this.secretAccessKey.clearValidators();
    } else {
      this.accessKeyId.setValidators([Validators.required]);
      this.secretAccessKey.setValidators([Validators.required]);
    }

    this.accessKeyId.updateValueAndValidity();
    this.secretAccessKey.updateValueAndValidity();
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
