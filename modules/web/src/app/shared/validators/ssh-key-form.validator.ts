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

import {FormControl, ValidatorFn} from '@angular/forms';

/**
 * Validation on the frontend part allows to avoid unnecessary backend calls.
 * Read more: https://tools.ietf.org/html/rfc4253#section-6.6
 */
export function SSHKeyFormValidator(): ValidatorFn {
  return (control: FormControl): any => {
    const splitForm = control.value.toString().trim().split(' ');
    const rangeStart = 2;
    const rangeEnd = 3;

    if (splitForm.length < rangeStart || splitForm.length > rangeEnd) {
      return {validSSHKey: true}; // Key type and encoded data are required. Comment part is optional.
    }

    try {
      const encoded = window.atob(splitForm[1]);
      if (!encoded.includes(splitForm[0])) {
        return {validSSHKey: true}; // Key type should be also included in encoded data.
      }
    } catch (err) {
      return {validSSHKey: true}; // Not able to decode SSH key.
    }

    return null;
  };
}
