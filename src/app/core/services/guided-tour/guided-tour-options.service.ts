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

import {GuidedTourOptions} from '@shared/entity/guided-tour';

@Injectable()
export class GuidedTourOptionsService {
  private _stepDefaultPosition = 'bottom';
  private _showPrevButton = true;
  private _stepsOrder: string[] = [];
  private _firstStep: string;
  private _waitingTime: number;
  private readonly _defaultTimeoutBetweenSteps = 1;

  setOptions(options: GuidedTourOptions): void {
    this._stepsOrder = options.steps;
    this._stepDefaultPosition = options.stepDefaultPosition ? options.stepDefaultPosition : this._stepDefaultPosition;
    this._showPrevButton =
      typeof options.showPrevButton !== 'undefined' ? options.showPrevButton : this._showPrevButton;
    this._firstStep = options.startWith;
    this._waitingTime =
      typeof options.waitingTime !== 'undefined' ? options.waitingTime : this._defaultTimeoutBetweenSteps;
  }

  getStepDefaultPosition(): string {
    return this._stepDefaultPosition;
  }

  getStepsOrder(): string[] {
    return this._stepsOrder;
  }

  getFirstStep(): string {
    return this._firstStep;
  }

  getWaitingTime() {
    return this._waitingTime;
  }

  isPrevButtonVisible(): boolean {
    return this._showPrevButton;
  }
}
