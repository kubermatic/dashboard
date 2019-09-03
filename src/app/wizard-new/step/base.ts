import {AbstractControl, FormGroup} from '@angular/forms';

import {CoreModule} from '../../core/core.module';
import {NewWizardService} from '../../core/services';

export class StepBase {
  readonly controls: {[key: string]: string};

  protected readonly _wizard: NewWizardService;

  constructor(controls: {[key: number]: string} = {}) {
    this._wizard = CoreModule.injector.get(NewWizardService);
    this.controls = controls;
  }

  private _form: FormGroup;

  set form(form: FormGroup) {
    if (!this._form) {
      this._form = form;
      return;
    }

    Object.keys(form.controls).forEach(key => {
      this._form.addControl(key, form.controls[key]);
    });
  }

  get form(): FormGroup {
    return this._form;
  }

  control(name: string): AbstractControl {
    return this.form.controls[name];
  }

  controlValue(name: string): any {
    return this.form.controls[name].value;
  }

  next(): void {
    this._wizard.stepper.next();
  }

  reset(controls: string[]): void {
    Object.keys(this._form.controls).filter(key => !controls.includes(key)).forEach(key => {
      this._form.removeControl(key);
    });
  }
}
