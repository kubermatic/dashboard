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

import {FormControl} from '@angular/forms';
import {TaintFormValidators} from './taint-form.validators';

const tooLongValue = 'L1txKHOWiSe5dSUakuYw82l2IepfxxBMbDA6JFCzp1TeFQbEvQmpJkcBDU4Npv50';

describe('TaintFormValidators', () => {
  it('taintEffect should be valid', () => {
    const control = {value: 'NoSchedule'} as FormControl;
    const result = TaintFormValidators.taintValidEffect(control);
    expect(result).toBe(null);
  });

  it('taintEffect should be invalid', () => {
    const control = {value: 'invalid'} as FormControl;
    const result = TaintFormValidators.taintValidEffect(control);
    expect(result).not.toBe(null);
  });

  it('taintValueLength should be valid', () => {
    const control = {value: 'value'} as FormControl;
    const result = TaintFormValidators.taintValueLength(control);
    expect(result).toBe(null);
  });

  it('taintValueLength should be invalid if too long', () => {
    const control = {value: tooLongValue} as FormControl;
    const result = TaintFormValidators.taintValueLength(control);
    expect(result).not.toBe(null);
  });
});
