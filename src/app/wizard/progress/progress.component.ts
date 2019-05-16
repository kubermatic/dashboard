import {Component, Input} from '@angular/core';
import {Step, StepsService} from '../../core/services/wizard/steps.service';

@Component({
  selector: 'kubermatic-progress',
  templateUrl: 'progress.component.html',
  styleUrls: ['progress.component.scss'],
})
export class ProgressComponent {
  @Input() steps: Step[] = [];
  @Input() currentStepIndex = 0;
  @Input() currentStep: Step;

  constructor(private stepsService: StepsService) {}

  getTitleClass(step: number): string {
    let titleClass = '';

    if (this.currentStepIndex < step) {
      titleClass = 'km-title-unchecked';
    }
    return titleClass;
  }

  getCursor(step: number): string {
    let cursor = 'default';

    if (this.currentStepIndex > step) {
      cursor = 'pointer';
    }

    return cursor;
  }

  gotoStep(i: number, step: Step): void {
    if (this.currentStepIndex > i) {
      this.stepsService.changeCurrentStep(i, step);
    }
  }
}
