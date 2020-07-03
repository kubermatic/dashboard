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

import {Component, Input} from '@angular/core';
import {Step, StepsService} from '../../core/services/wizard/steps.service';

@Component({
  selector: 'km-wizard-progress',
  templateUrl: 'progress.component.html',
})
export class ProgressComponent {
  @Input() steps: Step[] = [];
  @Input() currentStepIndex = 0;
  @Input() currentStep: Step;

  constructor(private stepsService: StepsService) {}

  gotoStep(i: number, step: Step): void {
    if (this.currentStepIndex > i) {
      this.stepsService.changeCurrentStep(i, step);
    }
  }
}
