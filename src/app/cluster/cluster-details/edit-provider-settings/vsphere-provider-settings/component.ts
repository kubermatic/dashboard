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
import {ClusterService} from '@core/services/cluster/service';
import {ProviderSettingsPatch} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-vsphere-provider-settings',
  templateUrl: './template.html',
})
export class VSphereProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;

  private readonly _debounceTime = 1000;
  private _formData = {
    infraManagementUsername: '',
    infraManagementPassword: '',
    username: '',
    password: '',
  };
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      infraManagementUsername: new FormControl(''),
      infraManagementPassword: new FormControl(''),
      username: new FormControl(''),
      password: new FormControl(''),
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (
          data.infraManagementUsername !== this._formData.infraManagementUsername ||
          data.infraManagementPassword !== this._formData.infraManagementPassword ||
          data.username !== this._formData.username ||
          data.password !== this._formData.password
        ) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
        }
      });
  }

  get infraManagementUsername(): AbstractControl {
    return this.form.controls.infraManagementUsername;
  }

  get infraManagementPassword(): AbstractControl {
    return this.form.controls.infraManagementPassword;
  }

  setValidators(): void {
    if (!this.infraManagementUsername.value && !this.infraManagementPassword.value) {
      this.infraManagementUsername.clearValidators();
      this.infraManagementPassword.clearValidators();
    } else {
      this.infraManagementUsername.setValidators([Validators.required]);
      this.infraManagementPassword.setValidators([Validators.required]);
    }

    this.infraManagementUsername.updateValueAndValidity();
    this.infraManagementPassword.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.infraManagementUsername.value && !this.infraManagementPassword.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        vsphere: {
          password: this.form.controls.password.value,
          username: this.form.controls.username.value,
          infraManagementUser: {
            username: this.form.controls.infraManagementUsername.value,
            password: this.form.controls.infraManagementPassword.value,
          },
        },
      },
      isValid: this.form.valid,
    };
  }
}
