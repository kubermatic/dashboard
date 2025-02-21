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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {WizardService} from '@core/services/wizard/wizard';
import {Cluster} from '@shared/entity/cluster';
import {StepBase} from '../base';

enum Controls {
  MachineNetwork = 'machineNetwork',
}

@Component({
    selector: 'km-wizard-machine-network-step',
    templateUrl: 'template.html',
    styleUrls: ['style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MachineNetworkStepComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MachineNetworkStepComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class MachineNetworkStepComponent
  extends StepBase
  implements OnInit, ControlValueAccessor, Validator, OnDestroy
{
  cluster: Cluster;

  readonly controls = Controls;

  constructor(
    wizard: WizardService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _builder: FormBuilder
  ) {
    super(wizard);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.MachineNetwork]: this._builder.control(''),
    });

    this.cluster = this._clusterSpecService.cluster;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
