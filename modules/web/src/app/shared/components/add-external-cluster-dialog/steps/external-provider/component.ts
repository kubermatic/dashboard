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
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ExternalClusterService} from '@core/services/external-cluster';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  Provider = 'provider',
}

@Component({
  selector: 'km-external-cluster-provider-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class ExternalClusterProviderStepComponent implements OnInit, OnDestroy {
  readonly controls = Controls;
  readonly provider = ExternalClusterProvider;
  readonly externalProviders = [ExternalClusterProvider.AKS, ExternalClusterProvider.EKS, ExternalClusterProvider.GKE];
  form: FormGroup;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onProviderChanged(provider: ExternalClusterProvider) {
    this.form.get(Controls.Provider).setValue(provider);
  }

  private _initForm() {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
    });
  }

  private _initSubscriptions() {
    this.form
      .get(Controls.Provider)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => (this._externalClusterService.provider = provider));
  }
}
