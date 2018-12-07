import {AbstractControl} from '@angular/forms';
import {fakeClusterWithMachineNetwork, fakeGatewayInCidr, fakeGatewayNotInCidr} from '../../testing/fake-data/clusterWithMachineNetworks.fake';
import {NoIpsLeftValidator} from './no-ips-left.validator';

describe('NoIPsLeftwValidator', () => {
  it('enough ips left', () => {
    const validatorFn = NoIpsLeftValidator(fakeClusterWithMachineNetwork(), 0);
    const control = {value: 3};
    const result = validatorFn(control as AbstractControl);
    expect(result).toBe(null);
  });

  it('not enough ips left', () => {
    const validatorFn = NoIpsLeftValidator(fakeClusterWithMachineNetwork(), 0);
    const control = {value: 10};
    const result = validatorFn(control as AbstractControl);
    expect(result['ipsMissing']).toBe(true);
  });

  it('gateway ip is in ip range', () => {
    const validatorFn = NoIpsLeftValidator(fakeGatewayInCidr(), 0);
    const control = {value: 6};
    const result = validatorFn(control as AbstractControl);
    expect(result['ipsMissing']).toBe(true);
  });

  it('gateway ip is not in ip range', () => {
    const validatorFn = NoIpsLeftValidator(fakeGatewayNotInCidr(), 0);
    const control = {value: 6};
    const result = validatorFn(control as AbstractControl);
    expect(result).toBe(null);
  });
});
