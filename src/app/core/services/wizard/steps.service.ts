// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {GoogleAnalyticsService} from '../../../google-analytics.service';

@Injectable()
export class StepsService {
  private _currentStepIndex = new Subject<number>();
  currentStepIndexChanges$ = this._currentStepIndex.asObservable();
  private _currentStep = new Subject<Step>();
  currentStepChanges$ = this._currentStep.asObservable();
  private _steps = new Subject<Step[]>();
  stepsChanges$ = this._steps.asObservable();

  constructor(public googleAnalyticsService: GoogleAnalyticsService) {}

  changeCurrentStep(index: number, step: Step): void {
    this.googleAnalyticsService.emitEvent('clusterCreation', 'clusterCreationWizardStepChangedTo' + step.name);
    this._currentStepIndex.next(index);
    this._currentStep.next(step);
  }

  changeSteps(steps: Step[]): void {
    this._steps.next(steps);
  }
}

export type StepValidator = () => boolean;

export class Step {
  name: string;
  valid: StepValidator;
  description: string;
}
