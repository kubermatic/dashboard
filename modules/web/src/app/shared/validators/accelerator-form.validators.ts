// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {AbstractControl, FormArray, FormGroup, ValidationErrors} from '@angular/forms';
import {ACCELERATOR_RESOURCE_NAME_PATTERN} from '@shared/validators/others';

export class AcceleratorFormValidators {
  static nameFormat(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    if (!value) {
      return null;
    }
    return ACCELERATOR_RESOURCE_NAME_PATTERN.test(value) ? null : {acceleratorNameFormat: true};
  }

  static uniqueName(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string;
    if (!value) {
      return null;
    }
    const siblings = (control.parent?.parent as FormArray<FormGroup<{[key: string]: AbstractControl}>>)?.controls ?? [];
    const occurrences = siblings.filter(row => row.get('key')?.value === value).length;
    return occurrences > 1 ? {duplicateAcceleratorName: true} : null;
  }
}
