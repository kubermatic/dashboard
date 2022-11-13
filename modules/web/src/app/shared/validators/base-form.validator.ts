// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
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
  protected onValueChange: (value: unknown) => unknown;

  protected constructor(private _formName = 'Form') {}

  // Validator interface implementation
  validate(_: AbstractControl): ValidationErrors | null {
    if (this.form.pending) {
      this._revalidateAfterPendingProcessEnds();
    }

    return this.form.valid || this.form.disabled
      ? null
      : {
          invalidForm: {
            valid: false,
            message: `${this._formName} validation failed.`,
          },
        };
  }

  // This method is required to rerun validation once form will be no longer in pending state.
  // It might be the case when at least one of the validators is async.
  // Without it validate method would return error and no longer check if the status has changed.
  private _revalidateAfterPendingProcessEnds(): void {
    const timeout = 500;
    if (this.form.pending) {
      setTimeout(() => this._revalidateAfterPendingProcessEnds(), timeout);
    } else {
      this.form.updateValueAndValidity();
    }
  }

  // ControlValueAccessor interface implementation
  registerOnChange(fn: any): void {
    this.onValueChange = fn;
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
