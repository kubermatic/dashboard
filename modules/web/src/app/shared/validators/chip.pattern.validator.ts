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
import _ from 'lodash';

export class ChipPatternValidator implements Validator {
  readonly _pattern: RegExp;

  constructor(pattern: string) {
    this._pattern = new RegExp(pattern);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!_.isArray(control.value)) {
      return null;
    }

    const value = control.value as [];
    return value.every(v => this._pattern.test(v)) ? null : this._error();
  }

  private _error(): ValidationErrors {
    return {
      pattern: {
        valid: false,
      },
    };
  }
}
