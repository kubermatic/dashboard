import {Component} from '@angular/core';
import {StepBase} from '../base';

@Component({
  selector: 'kubermatic-wizard-mock-step',
  template: 'MOCKED',
})
export class MockStepComponent extends StepBase {
  constructor() {
    super();
  }
}
