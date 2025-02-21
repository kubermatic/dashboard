// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {ExternalClusterService} from '@core/services/external-cluster';
import {Observable, of, Subject} from 'rxjs';
import {catchError, take, takeUntil} from 'rxjs/operators';
import {ProjectService} from '@core/services/project';

export enum Controls {
  TenantID = 'tenantID',
  SubscriptionID = 'subscriptionID',
  ClientID = 'clientID',
  ClientSecret = 'clientSecret',
}

@Component({
    selector: 'km-aks-credentials',
    templateUrl: './template.html',
    standalone: false
})
export class AKSCredentialsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  readonly Controls = Controls;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group(
      {
        [Controls.TenantID]: this._builder.control('', [Validators.required]),
        [Controls.SubscriptionID]: this._builder.control('', [Validators.required]),
        [Controls.ClientID]: this._builder.control('', [Validators.required]),
        [Controls.ClientSecret]: this._builder.control('', [Validators.required]),
      },
      {asyncValidators: [this._credentialsValidator.bind(this)]}
    );

    this.form.statusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._externalClusterService.isValidating = this.form.pending;
      this._externalClusterService.credentialsStepValidity = this.form.valid;
      this._externalClusterService.error = this.form.hasError('invalidCredentials')
        ? 'Provided credentials are invalid.'
        : undefined;
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._update();
      this._externalClusterService.isPresetEnabled = Object.values(Controls).every(c => !this.form.get(c).value);
    });

    this._externalClusterService.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _credentialsValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const tenantID = control.get(Controls.TenantID).value;
    const subscriptionID = control.get(Controls.SubscriptionID).value;
    const clientID = control.get(Controls.ClientID).value;
    const clientSecret = control.get(Controls.ClientSecret).value;
    if (!tenantID || !subscriptionID || !clientID || !clientSecret) {
      return of(null);
    }

    return this._externalClusterService
      .validateAKSCredentials(this._projectService.selectedProjectID, tenantID, subscriptionID, clientID, clientSecret)
      .pipe(take(1))
      .pipe(catchError(() => of({invalidCredentials: true})));
  }

  private _update(): void {
    this._externalClusterService.externalCluster = {
      name: '',
      cloud: {
        aks: {
          name: '',
          tenantID: this.form.get(Controls.TenantID).value,
          subscriptionID: this.form.get(Controls.SubscriptionID).value,
          clientID: this.form.get(Controls.ClientID).value,
          clientSecret: this.form.get(Controls.ClientSecret).value,
        },
      },
    };
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}
