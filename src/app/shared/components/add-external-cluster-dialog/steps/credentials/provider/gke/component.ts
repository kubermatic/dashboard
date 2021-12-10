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
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {CredentialsAsyncValidatorService} from '@shared/validators/async-credentials.validator';
import {Subject} from 'rxjs';

export enum Controls {
  ServiceAccount = 'serviceAccount',
}

@Component({
  selector: 'km-gke-credentials',
  templateUrl: './template.html',
})
export class GKECredentialsComponent implements OnInit, OnDestroy {
  form: FormGroup;
  readonly Controls = Controls;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _credentialsAsyncValidatorService: CredentialsAsyncValidatorService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ServiceAccount]: this._builder.control('', {
        validators: [Validators.required],
        asyncValidators: [this._credentialsAsyncValidatorService.gkeServiceAccountValidator()],
      }),
    });

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._externalClusterService.credentialsStepValidity = this.form.valid));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._externalClusterService.isPresetEnabled = Object.values(Controls).every(c => !this.form.get(c).value);
      this.update();
    });

    this._externalClusterService.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  update(): void {
    this._externalClusterService.externalCluster = {
      name: '',
      cloud: {
        gke: {
          name: '',
          serviceAccount: this.form.get(Controls.ServiceAccount).value,
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
