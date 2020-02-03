import {AbstractControl, FormGroup} from '@angular/forms';

import {CoreModule} from '../../core/core.module';
import {NewWizardService} from '../../core/services';

export class StepBase {
  readonly controls: {[key: string]: string};
  form: FormGroup;

  protected readonly _wizard: NewWizardService;
  protected readonly _debounceTime = 250;

  constructor(controls: {[key: number]: string} = {}) {
    this._wizard = CoreModule.injector.get(NewWizardService);
    this.controls = controls;
  }

  control(name: string): AbstractControl {
    return this.form.controls[name] ? this.form.controls[name] : {} as AbstractControl;
  }

  controlValue(name: string): any {
    return this.form.controls[name] ? this.form.controls[name].value : undefined;
  }

  next(): void {
    this._wizard.stepper.next();
  }

  reset(controls: string[] = []): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).filter(key => !controls.includes(key)).forEach(key => {
        this.form.removeControl(key);
      });
    }
  }

  enable(enable: boolean, name: string): void {
    if (enable && this.control(name).disabled) {
      this.control(name).enable();
    }

    if (!enable && this.control(name).enabled) {
      this.control(name).disable();
    }
  }

  areControlsEmpty(): boolean {
    return Object.values(this.controls).every(control => !this.controlValue(control));
  }

  hasError(control: string, errorName: string): boolean {
    return this.control(control).hasError(errorName);
  }
}
