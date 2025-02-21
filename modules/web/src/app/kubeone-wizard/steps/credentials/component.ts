// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, forwardRef, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {StepRegistry} from '@app/kubeone-wizard/config';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {KubeOneWizardService} from '@core/services/kubeone-wizard/wizard';

import {NodeProvider, NodeProviderConstants} from '@shared/model/NodeProviderConstants';
import {takeUntil} from 'rxjs/operators';
import {StepBase} from '../base';

enum Controls {
  Preset = 'preset',
  CredentialsBasic = 'credentialsBasic',
}

@Component({
  selector: 'km-kubeone-wizard-credentials-step',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeOneCredentialsStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeOneCredentialsStepComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class KubeOneCredentialsStepComponent extends StepBase implements OnInit {
  readonly NodeProvider = NodeProvider;
  readonly Control = Controls;

  provider: NodeProvider;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: KubeOneClusterSpecService,
    wizard: KubeOneWizardService
  ) {
    super(wizard, StepRegistry.Credentials);
  }

  get providerDisplayName(): string {
    return NodeProviderConstants.displayName(this.provider);
  }

  ngOnInit(): void {
    this._initForm();

    this._clusterSpecService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(provider => {
      this.provider = provider;
    });
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Preset]: this._builder.control(''),
      [Controls.CredentialsBasic]: this._builder.control(''),
    });
  }
}
