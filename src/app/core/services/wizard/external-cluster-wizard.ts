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

import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {Subject} from 'rxjs';
import {ExternalWizardStep, StepRegistry} from '@app/external-cluster-wizard/config';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {NodeDataService} from '@core/services/node-data/service';

@Injectable()
export class ExternalClusterWizardService {
  readonly stepsChanges = new EventEmitter<StepRegistry>();
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _nodeDataService: NodeDataService
  ) {}

  private _stepper: MatStepper;

  get stepper(): MatStepper {
    return this._stepper;
  }

  set stepper(stepper: MatStepper) {
    this._stepper = stepper;
  }

  private _steps: ExternalWizardStep[];

  get steps(): ExternalWizardStep[] {
    return this._steps;
  }

  set steps(steps: ExternalWizardStep[]) {
    this._steps = steps;
  }

  // set provider(provider: NodeProvider) {
  //   this._stepHandler.handleProviderChange(provider);
  //   this._clusterSpecService.provider = provider;
  // }

  reset(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._clusterSpecService.reset();
    this._nodeDataService.reset();
    this._unsubscribe = new Subject<void>();
  }
}
