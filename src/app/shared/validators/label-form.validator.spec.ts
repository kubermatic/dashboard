import {FormControl} from '@angular/forms';
import {LabelFormValidators} from './label-form.validators';

const validKey = 'env';
const tooLongKey = 'F4td6JTLp2AftZ7YtSwdf0m2K4yrwd6l8ynEQWICfgFjAfDgRDw3wNpbqsNMuTQg' +
    'OADHbknuQsE1rP643smxH4ZHRlZqu9zvB8odvkwQC90jlYnzuK20DIgK7K9FctcB6frA1Y2n2KGYvm9' +
    '82SHI2C1p9XmmSinNtRAdOYYCiKZcYjRFw4i7F3UxAtLCUsLKxG3FJbiPf0EJDvAUDnv2Ktr7nIEhtC' +
    'C9Q8hIumOMFzEc61YgQpXiRAeqpDmJSegE4';
const invalidKey = '!@#$%^&*';
const validPrefix = 'beta.kubernetes.io';
const tooLongPrefix = 'beta.JTLp2AftZ7YtSwdf0m2K4yrwd6l8ynEQWICfgFjAfDgRDw3wNpbqsNMu' +
    'OADHbknuQsE1rP643smxH4ZHRlZqu9zvB8odvkwQC90jlYnzuK20DIgK7K9FctcB6frA1Y2n2KGYvth' +
    '82SHI2C1p9XmmSinNtRAdOYYCiKZcYjRFw4i7F3UxAtLCUsLKxG3FJbiPf0EJDvAUDnv2Ktr7nIEpgD' +
    'C9Q8hIumOMFzEc61YgQpXiRAeq9CmTQmJSe.io';
const invalidPrefix = '!@#$%^&*';

describe('LabelFormValidators', () => {
  it('labelKeyNameLength should be valid', () => {
    const control = {value: validKey} as FormControl;
    const result = LabelFormValidators.labelKeyNameLength(control);
    expect(result).toBe(null);
  });

  it('labelKeyNameLength should be invalid', () => {
    const control = {value: tooLongKey} as FormControl;
    const result = LabelFormValidators.labelKeyNameLength(control);
    expect(result).not.toBe(null);
  });

  it('labelKeyPrefixLength should be valid', () => {
    const control = {value: `${validPrefix}/${validKey}`} as FormControl;
    const result = LabelFormValidators.labelKeyPrefixLength(control);
    expect(result).toBe(null);
  });

  it('labelKeyPrefixLength should be invalid', () => {
    const control = {value: `${tooLongPrefix}/${validKey}`} as FormControl;
    const result = LabelFormValidators.labelKeyPrefixLength(control);
    expect(result).not.toBe(null);
  });

  it('labelKeyNamePattern should be valid', () => {
    const control = {value: `${validKey}`} as FormControl;
    const result = LabelFormValidators.labelKeyNamePattern(control);
    expect(result).toBe(null);
  });

  it('labelKeyNamePattern should be invalid', () => {
    const control = {value: `${invalidKey}`} as FormControl;
    const result = LabelFormValidators.labelKeyNamePattern(control);
    expect(result).not.toBe(null);
  });

  it('labelKeyPrefixPattern should be valid', () => {
    const control = {value: `${validPrefix}/${validKey}`} as FormControl;
    const result = LabelFormValidators.labelKeyPrefixPattern(control);
    expect(result).toBe(null);
  });

  it('labelKeyPrefixPattern should be invalid', () => {
    const control = {value: `${invalidPrefix}/${validKey}`} as FormControl;
    const result = LabelFormValidators.labelKeyPrefixPattern(control);
    expect(result).not.toBe(null);
  });
});
