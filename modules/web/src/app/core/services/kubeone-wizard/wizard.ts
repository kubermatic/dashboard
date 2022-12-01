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

import {Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {KubeOneWizardStep, StepRegistry} from '@app/kubeone-wizard/config';
import {Subject} from 'rxjs';

@Injectable()
export class KubeOneWizardService {
  readonly stepsChanges = new Subject<StepRegistry>();

  private _stepper: MatStepper;
  private _steps: KubeOneWizardStep[];
  private _unsubscribe = new Subject<void>();

  constructor() {}

  get stepper(): MatStepper {
    return this._stepper;
  }

  set stepper(stepper: MatStepper) {
    this._stepper = stepper;
  }

  get steps(): KubeOneWizardStep[] {
    return this._steps;
  }

  set steps(steps: KubeOneWizardStep[]) {
    this._steps = steps;
  }

  reset(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();

    this._unsubscribe = new Subject<void>();
  }
}
