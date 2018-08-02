import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

@Injectable()
export class StepsService {

  private _currentStepIndex = new Subject<number>();
  currentStepIndexChanges$ = this._currentStepIndex.asObservable();
  private _currentStep = new Subject<Step>();
  currentStepChanges$ = this._currentStep.asObservable();
  private _steps = new Subject<Step[]>();
  stepsChanges$ = this._steps.asObservable();

  constructor(public googleAnalyticsService: GoogleAnalyticsService) {
  }

  changeCurrentStep(index: number, step: Step) {
    this.googleAnalyticsService.emitEvent('clusterOverview', 'clusterCreationWizardStepChangedTo' + step.name);
    this._currentStepIndex.next(index);
    this._currentStep.next(step);
  }

  changeSteps(steps: Step[]) {
    this._steps.next(steps);
  }
}

export type StepValidator = () => boolean;

export class Step {
  name: string;
  valid: StepValidator;
  description: string;
}
