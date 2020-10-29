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
import {Subject} from 'rxjs';

import {GuidedTourStep, Step, StepActionType} from '@shared/entity/guided-tour';
import {GuidedTourOptionsService} from './guided-tour-options.service';
import {GuidedTourItemsService} from './guided-tour-items.service';

@Injectable()
export class GuidedTourStepsContainerService {
  private _steps: Step[];
  private _tempSteps: GuidedTourStep[] = [];
  private _currentStepIndex = 0;
  stepHasBeenModified: Subject<GuidedTourStep> = new Subject<GuidedTourStep>();

  constructor(
    private readonly _guidedTourStepOptionsService: GuidedTourOptionsService,
    private readonly _guidedTourItemsService: GuidedTourItemsService
  ) {}

  private _getFirstStepIndex(): number {
    const firstStep = this._guidedTourStepOptionsService.getFirstStep();
    const stepIds = this._guidedTourStepOptionsService.getStepsOrder();

    let index = stepIds.indexOf(firstStep);
    if (index < 0) {
      index = 0;
    }

    return index;
  }

  init(): void {
    this._steps = [];
    this._currentStepIndex = this._getFirstStepIndex() - 1;
    const stepIds = this._guidedTourStepOptionsService.getStepsOrder();
    stepIds.forEach(stepId => {
      const stepItem = this._guidedTourItemsService.getGuidedTourItems().find(item => item.id === stepId);
      const stepRoute = stepItem && stepItem.route ? stepItem.route : '';
      this._steps.push({id: stepId, step: null, route: stepRoute});
    });
  }

  addStep(stepToAdd: GuidedTourStep): void {
    const stepExist = this._tempSteps.filter(step => step.name === stepToAdd.name).length > 0;
    if (!stepExist) {
      this._tempSteps.push(stepToAdd);
    } else {
      const stepIndexToReplace = this._tempSteps.findIndex(step => step.name === stepToAdd.name);
      this._tempSteps[stepIndexToReplace] = stepToAdd;
    }
  }

  getStep(action: StepActionType): GuidedTourStep {
    if (action === StepActionType.NEXT) {
      this._currentStepIndex++;
    } else {
      this._currentStepIndex--;
    }

    const stepName = this._getStepName(this._steps[this._currentStepIndex].id);
    const index = this._tempSteps.findIndex(step => step.name === stepName);
    const stepFound = this._tempSteps[index];
    this._steps[this._currentStepIndex].step = stepFound;

    return stepFound;
  }

  getStepRoute(action: StepActionType): string {
    if (action === StepActionType.NEXT) {
      return this._steps[this._currentStepIndex + 1] ? this._steps[this._currentStepIndex + 1].route : '';
    }
    return this._steps[this._currentStepIndex - 1] ? this._steps[this._currentStepIndex - 1].route : '';
  }

  updatePosition(stepName: string, position: string): void {
    const index = this._getStepIndex(stepName);
    if (this._steps[index].step) {
      this._steps[index].step.position = position;
      this.stepHasBeenModified.next(this._steps[index].step);
    }
  }

  getStepNumber(stepName: string): number {
    return this._getStepIndex(stepName) + 1;
  }

  getStepsCount(): number {
    const stepsOrder = this._guidedTourStepOptionsService.getStepsOrder();
    return stepsOrder.length;
  }

  private _getStepIndex(stepName: string): number {
    const index = this._steps.map(step => step.id).findIndex(name => stepName === name);
    return index;
  }

  private _getStepName(stepID: string): string {
    return stepID;
  }
}
