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
import {takeUntil} from 'rxjs/operators';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {Subject} from 'rxjs';

enum Controls {
  Provider = 'provider',
}

@Component({
  selector: 'km-external-cluster-provider-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ExternalClusterProviderStepComponent implements OnInit, OnDestroy {
  form: FormGroup;
  readonly controls = Controls;
  readonly provider = ExternalClusterProvider;
  readonly EXTERNAL_PROVIDERS = [ExternalClusterProvider.AKS, ExternalClusterProvider.EKS, ExternalClusterProvider.GKE];
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
    });

    this.form
      .get(Controls.Provider)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => (this._externalClusterService.provider = provider));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
