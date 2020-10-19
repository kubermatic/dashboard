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
  selector: 'km-gcp-provider-settings',
  templateUrl: './gcp-provider-settings.component.html',
})
export class GCPProviderSettingsComponent implements OnInit, OnDestroy {
  form: FormGroup;

  private readonly _debounceTime = 1000;
  private _formData = {serviceAccount: ''};
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      serviceAccount: new FormControl(''),
    });

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        if (data.serviceAccount !== this._formData.serviceAccount) {
          this._formData = data;
          this.setValidators();
          this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
        }
      });
  }

  get serviceAccount(): AbstractControl {
    return this.form.controls.serviceAccount;
  }

  setValidators(): void {
    if (!this.serviceAccount.value) {
      this.serviceAccount.clearValidators();
    } else {
      this.serviceAccount.setValidators([Validators.required]);
    }

    this.serviceAccount.updateValueAndValidity();
  }

  isRequiredField(): string {
    return !this.serviceAccount.value ? '' : '*';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        gcp: {
          serviceAccount: this.form.controls.serviceAccount.value,
        },
      },
      isValid: this.form.valid,
    };
  }
}
