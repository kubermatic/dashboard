// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

export class EncryptionKeyValidator implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    // 32-byte encryption key must encode to exactly 44 base64 characters
    // Format: 43 base64 characters + exactly 1 padding character ('=')
    // This strict pattern prevents malformed keys that could decode to wrong byte length
    const base64Regex = /^[A-Za-z0-9+/]{43}=$/;
    if (!base64Regex.test(value)) {
      return this._invalidBase64Error();
    }

    return null;
  }

  private _invalidBase64Error(): ValidationErrors {
    return {
      invalidBase64: {
        valid: false,
      },
    };
  }
}
