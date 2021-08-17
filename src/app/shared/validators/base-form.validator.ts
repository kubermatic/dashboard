// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {AbstractControl, ControlValueAccessor, FormGroup, ValidationErrors, Validator} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export abstract class BaseFormValidator implements ControlValueAccessor, Validator {
  form: FormGroup;
  protected _unsubscribe = new Subject<void>();

  protected constructor(private _formName = 'Form') {}

  // Validator interface implementation
  validate(_: AbstractControl): ValidationErrors | null {
    return this.form.valid || this.form.disabled
      ? null
      : {
          invalidForm: {
            valid: false,
            message: `${this._formName} validation failed.`,
          },
        };
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

  reset(): void {
    Object.keys(this.form.controls).forEach(field => {
      this.form.get(field).reset();
      this.form.get(field).setErrors(null);
    });
  }
}
