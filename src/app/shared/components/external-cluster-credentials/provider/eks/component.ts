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
import {merge, Observable, of, Subject} from 'rxjs';
import {catchError, take, takeUntil, tap, debounceTime} from 'rxjs/operators';

export enum Controls {
  AccessKeyID = 'accessKeyID',
  SecretAccessKey = 'secretAccessKey',
  Region = 'region',
}

@Component({
  selector: 'km-eks-credentials',
  templateUrl: './template.html',
})
export class EKSCredentialsComponent implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly DEFAULT_LOCATION = 'eu-central-1';
  form: FormGroup;
  regions: string[] = [];
  private readonly _debounceTime = 500;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group(
      {
        [Controls.AccessKeyID]: this._builder.control('', [Validators.required]),
        [Controls.SecretAccessKey]: this._builder.control('', [Validators.required]),
        [Controls.Region]: this._builder.control('', [Validators.required]),
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

    merge(this.form.get(Controls.AccessKeyID).valueChanges, this.form.get(Controls.SecretAccessKey).valueChanges)
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        this._getEKSRegions();
      });

    this._externalClusterService.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getEKSRegions(): void {
    if (this._externalClusterService.preset) {
      return;
    }
    const accessKeyID = this.form.get(Controls.AccessKeyID).value;
    const secretAccessKey = this.form.get(Controls.SecretAccessKey).value;
    if (accessKeyID && secretAccessKey) {
      this._externalClusterService
        .getEKSRegions(accessKeyID, secretAccessKey)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((regions: string[]) => {
          this.regions = regions;
          regions.map(region => {
            if (region === this.DEFAULT_LOCATION) {
              this.form.get(Controls.Region).setValue(this.DEFAULT_LOCATION);
            }
          });
        });
    } else {
      this.regions = [];
      this.form.get(Controls.Region).setValue('');
    }
  }

  private _credentialsValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const accessKeyID = control.get(Controls.AccessKeyID).value;
    const secretAccessKey = control.get(Controls.SecretAccessKey).value;
    const region = control.get(Controls.Region).value;

    if (!accessKeyID || !secretAccessKey || !region) {
      return of(null);
    }

    return this._externalClusterService
      .validateEKSCredentials(accessKeyID, secretAccessKey, region)
      .pipe(take(1))
      .pipe(tap(response => (this._externalClusterService.isCredentialsValidated = !!response)))
      .pipe(catchError(() => of({invalidCredentials: true})));
  }

  private _update(): void {
    this._externalClusterService.externalCluster = {
      name: '',
      cloud: {
        eks: {
          name: '',
          accessKeyID: this.form.get(Controls.AccessKeyID).value,
          secretAccessKey: this.form.get(Controls.SecretAccessKey).value,
          region: this.form.get(Controls.Region).value,
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
