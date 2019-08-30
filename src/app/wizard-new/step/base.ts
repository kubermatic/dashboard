import {AbstractControl, FormGroup} from '@angular/forms';

import {CoreModule} from '../../core/core.module';
import {NewWizardService} from '../../core/services';

export class StepBase {
  protected readonly _wizard: NewWizardService;

  constructor() {
    this._wizard = CoreModule.injector.get(NewWizardService);
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
}
