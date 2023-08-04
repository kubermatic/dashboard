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

import {AbstractControl, ValidationErrors, Validator} from '@angular/forms';

export class LargerThanValidator implements Validator {
  constructor(
    readonly min: number,
    readonly inclusive: boolean
  ) {}

  validate(control: AbstractControl): ValidationErrors | null {
    if ((!control.value && control.value !== 0) || control.value.length === 0) {
      return null;
    }

    const value = +control.value;

    if (isNaN(value)) {
      return this._error(value);
    }

    return this.inclusive
      ? value >= this.min
        ? null
        : this._error(value)
      : value > this.min
      ? null
      : this._error(value);
  }

  private _error(value: number) {
    return {
      largerThan: {
        min: this.min,
        inclusive: this.inclusive,
        actual: value,
      },
    };
  }
}
