import {AbstractControl, ControlValueAccessor, FormGroup, ValidationErrors, Validator} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export class BaseFormValidator implements ControlValueAccessor, Validator {
  form: FormGroup;
  protected _unsubscribe = new Subject<void>();

  constructor(private _formName = 'Form') {}

  // Validator interface implementation
  validate(control: AbstractControl): ValidationErrors|null {
    return this.form.valid || this.form.disabled ?
        null :
        {invalidForm: {valid: false, message: `${this._formName} validation failed.`}};
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

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.form.disable() : this.form.enable();
  }
}
