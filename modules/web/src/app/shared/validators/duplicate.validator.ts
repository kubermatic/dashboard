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

import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function duplicateValidator(existingValues: string[], ignoreCase = true): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();

    const isDuplicate = existingValues.some(existingValue => {
      if (ignoreCase) {
        return existingValue.toLowerCase() === value.toLowerCase();
      }
      return existingValue === value;
    });

    return isDuplicate ? {duplicate: true} : null;
  };
}
