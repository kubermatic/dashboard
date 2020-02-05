import {AbstractControl, FormGroup, ValidationErrors} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {CoreModule} from '../../core/core.module';
import {NewWizardService} from '../../core/services';

export class StepBase {
  form: FormGroup;

  protected readonly _wizard: NewWizardService;
  protected readonly _unsubscribe: Subject<void> = new Subject<void>();

  constructor() {
    this._wizard = CoreModule.injector.get(NewWizardService);
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
        this.form.reset(key);
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

  hasError(control: string, errorName: string): boolean {
    return this.control(control).hasError(errorName);
  }

  // OnDestroy interface implementation
  ngOnDestroy(): void {
    this.reset();
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  // Validator interface implementation
  validate(_: AbstractControl): ValidationErrors|null {
    return this.form.valid ? null : {invalidForm: {valid: false, message: 'Step form fields are invalid'}};
  }

  // ControlValueAccessor interface implementation
  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(_: any): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }
}
