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

import {AbstractControl} from '@angular/forms';
import {
  fakeClusterWithMachineNetwork,
  fakeGatewayInCidr,
  fakeGatewayNotInCidr,
} from '@test/data/cluster-with-machine-networks';
import {NoIpsLeftValidator} from './no-ips-left.validator';

describe('NoIPsLeftwValidator', () => {
  it('enough ips left', () => {
    const validatorFn = NoIpsLeftValidator(fakeClusterWithMachineNetwork().spec.machineNetworks, 0);
    const control = {value: 3};
    const result = validatorFn(control as AbstractControl);
    expect(result).toBe(null);
  });

  it('not enough ips left', () => {
    const validatorFn = NoIpsLeftValidator(fakeClusterWithMachineNetwork().spec.machineNetworks, 0);
    const control = {value: 10};
    const result = validatorFn(control as AbstractControl);
    expect(result['ipsMissing']).toBe(true);
  });

  it('gateway ip is in ip range', () => {
    const validatorFn = NoIpsLeftValidator(fakeGatewayInCidr().spec.machineNetworks, 0);
    const control = {value: 6};
    const result = validatorFn(control as AbstractControl);
    expect(result['ipsMissing']).toBe(true);
  });

  it('gateway ip is not in ip range', () => {
    const validatorFn = NoIpsLeftValidator(fakeGatewayNotInCidr().spec.machineNetworks, 0);
    const control = {value: 6};
    const result = validatorFn(control as AbstractControl);
    expect(result).toBe(null);
  });
});
