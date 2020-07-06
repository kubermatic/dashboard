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
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../shared/entity/cluster';

@Component({
  selector: 'km-openstack-provider-settings',
  templateUrl: './openstack-provider-settings.component.html',
})
export class OpenstackProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  private _formData = {username: '', password: ''};
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      username: new FormControl(''),
      password: new FormControl(''),
    });

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (data.username !== this._formData.username || data.password !== this._formData.password) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
        }
      });
  }

  get username(): AbstractControl {
    return this.form.controls.username;
  }

  get password(): AbstractControl {
    return this.form.controls.password;
  }

  setValidators(): void {
    if (!this.username.value && !this.password.value) {
      this.username.clearValidators();
      this.password.clearValidators();
    } else {
      this.username.setValidators([Validators.required]);
      this.password.setValidators([Validators.required]);
    }

    this.username.updateValueAndValidity();
    this.password.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.username.value && !this.password.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        openstack: {
          password: this.form.controls.password.value,
          username: this.form.controls.username.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
