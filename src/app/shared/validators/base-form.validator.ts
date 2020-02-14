import {AbstractControl, ControlValueAccessor, FormGroup, ValidationErrors, Validator} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export class BaseFormValidator implements ControlValueAccessor, Validator {
  form: FormGroup;
  protected _unsubscribe = new Subject<void>();

  // Validator interface implementation
  validate(_: AbstractControl): ValidationErrors|null {
    return this.form.valid || this.form.disabled ? null :
                                                   {invalidForm: {valid: false, message: 'Form validation failed.'}};
  }

  // ControlValueAccessor interface implementation
  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.form.statusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }
}
