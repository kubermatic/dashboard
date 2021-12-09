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
import {take, takeUntil} from 'rxjs/operators';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {Subject} from 'rxjs';

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
  form: FormGroup;
  isValidationPending = false;
  areCredentialsValid = false;
  readonly Controls = Controls;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AccessKeyID]: this._builder.control('', [Validators.required]),
      [Controls.SecretAccessKey]: this._builder.control('', [Validators.required]),
      [Controls.Region]: this._builder.control('', [Validators.required]),
    });

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        _ =>
          (this._externalClusterService.credentialsStepValidity =
            this.form.valid && this.areCredentialsValid && !this.isValidationPending)
      );

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._update();
      this._validate();
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

  private _validate(): void {
    this.isValidationPending = true;
    const accessKeyID = this.form.get(Controls.AccessKeyID).value;
    const secretAccessKey = this.form.get(Controls.SecretAccessKey).value;
    const region = this.form.get(Controls.Region).value;
    if (accessKeyID && secretAccessKey && region) {
      this._externalClusterService
        .validateEKSCredentials(accessKeyID, secretAccessKey, region)
        .pipe(take(1))
        .subscribe({
          next: _ => {
            this.isValidationPending = false;
            this.areCredentialsValid = true;
          },
          error: _ => {
            this.isValidationPending = false;
            this.areCredentialsValid = false;
          },
        });
    } else {
      this.isValidationPending = false;
      this.areCredentialsValid = false;
    }
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
