import {Input} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';

export class NodeDataProviderBase {
  protected readonly _debounceTime = 250;

  @Input('form') private _form: FormGroup;

  constructor() {}

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
    return this.form.controls[name] ? this.form.controls[name] : {} as AbstractControl;
  }

  controlValue(name: string): any {
    return this.form.controls[name] ? this.form.controls[name].value : undefined;
  }

  isEnabled(name: string): boolean {
    return this.form.controls[name].enabled;
  }

  enable(enable: boolean, name: string): void {
    if (enable && this.control(name).disabled) {
      this.control(name).enable();
    }

    if (!enable && this.control(name).enabled) {
      this.control(name).disable();
    }
  }

  hasError(control: string, errorName: string): boolean {
    return this.control(control).hasError(errorName);
  }
}
