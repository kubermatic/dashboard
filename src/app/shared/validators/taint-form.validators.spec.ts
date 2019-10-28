import {FormControl} from '@angular/forms';
import {TaintFormValidators} from './taint-form.validators';

const tooLongValue = 'L1txKHOWiSe5dSUakuYw82l2IepfxxBMbDA6JFCzp1TeFQbEvQmpJkcBDU4Npv50';

describe('TaintFormValidators', () => {
  it('taintEffect should be valid', () => {
    const control = {value: `NoSchedule`} as FormControl;
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
