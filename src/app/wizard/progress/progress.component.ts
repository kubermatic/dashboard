import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Step, StepsService} from '../../core/services/wizard/steps.service';

@Component({
  selector: 'kubermatic-progress',
  templateUrl: 'progress.component.html',
  styleUrls: ['progress.component.scss'],
})
export class ProgressComponent implements OnInit, OnDestroy {
  @Input() steps: Step[] = [];
  @Input() currentStepIndex = 0;
  @Input() currentStep: Step;

  constructor(private stepsService: StepsService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  getIconClass(step: number): string {
    let iconClass = 'fa fa-circle-o-notch fa-spin';

    if (this.currentStepIndex > step) {
      iconClass = 'fa fa-check';
    } else if (this.currentStepIndex < step) {
      iconClass = '';
    }

    return iconClass;
  }

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
