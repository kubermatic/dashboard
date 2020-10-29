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

import {ViewContainerRef, EventEmitter} from '@angular/core';
import {GuidedTourStepComponent} from '@shared/components/guided-tour/step/step.component';

export class GuidedTourItem {
  id: string;
  title?: string;
  text?: string;
  nextText?: string;
  stepPosition?: string;
  route?: string;
}

export class GuidedTourOptions {
  steps: string[];
  startWith?: string;
  stepDefaultPosition?: string;
  showPrevButton?: boolean;
  waitingTime?: number;
}

export class GuidedTourStepInfo {
  number: number;
  name: string;
  route: string;
  actionType: StepActionType;
}

export class Step {
  id: string;
  step: GuidedTourStep;
  route: string;
}

export enum StepActionType {
  NEXT = 'NEXT',
  PREV = 'PREV',
}

export class GuidedTourStep {
  name: string;
  route: string;
  position: string;
  title: string;
  text: string;
  nextText?: string;
  nextClicked: EventEmitter<any>;
  prevCliked: EventEmitter<any>;
  tourDone: EventEmitter<any>;
  isElementOrAncestorFixed: boolean;
  targetViewContainer: ViewContainerRef;
  stepInstance: GuidedTourStepComponent;
}
