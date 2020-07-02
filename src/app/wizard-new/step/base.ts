import {AbstractControl} from '@angular/forms';
import {BaseFormValidator} from '../../shared/validators/base-form.validator';
import {WizardService} from '../service/wizard';

export class StepBase extends BaseFormValidator {
  constructor(protected readonly _wizard: WizardService, formName = 'Form') {
    super(formName);
  }

  control(name: string): AbstractControl {
    return this.form.controls[name] ? this.form.controls[name] : ({} as AbstractControl);
  }

  controlValue(name: string): any {
    return this.form.controls[name] ? this.form.controls[name].value : undefined;
  }

  next(): void {
    this._wizard.stepper.next();
  }

  enable(enable: boolean, name: string): void {
    if (enable && this.control(name).disabled) {
      this.control(name).enable();
    }

    if (!enable && this.control(name).enabled) {
      this.control(name).disable();
    }
  }

  // OnDestroy interface implementation
  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._reset();
  }

  private _reset(controls: string[] = []): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls)
        .filter(key => !controls.includes(key))
        .forEach(key => {
          this.form.reset(key);
        });
    }
  }
}
