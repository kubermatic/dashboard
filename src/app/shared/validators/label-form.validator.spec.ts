import {FormControl} from '@angular/forms';
import {LabelFormValidators} from './label-form.validators';

const char8 = 'fG5d3rh8';
const char64 = 'Zr8bVgxVyLc4VbEa92Gkz97i4wIUCyiECNYKdYejvi1VeCG4axjJaZ232ok69ayk';
const char256 = 'je85JTLp2AftZ7YtSwdf0m2K4yrwd6l8ynEQWICfgFjAfDgRDw3wNpbqsNEhItM' +
    'OADHbknuQsE1rP643smxH4ZHRlZqu9zvB8odvkwQC90jlYnzuK20DIgK7K9FctcB6frA1Y2n2KGYv' +
    '82SHI2C1p9XmmSinNtRAdOYYCiKZcY41jRFw4i7F3UxAtLCUsLKxG3FJbiPf0EJDvAUDnv2Ktr7nI' +
    'C9Q8hIumOMFzEc61YgQpXiRAeqpg9CDmTQJSeum';

describe('LabelFormValidators', () => {
  it('labelKeyNameLength should be valid', () => {
    const control = {value: char8} as FormControl;
    const result = LabelFormValidators.labelKeyNameLength(control);
    expect(result).toBe(null);
  });

  it('labelKeyNameLength should be invalid', () => {
    const control = {value: char64} as FormControl;
    const result = LabelFormValidators.labelKeyNameLength(control);
    expect(result).not.toBe(null);
  });

  it('labelKeyPrefixLength should be valid', () => {
    const control = {value: `${char8}/${char8}`} as FormControl;
    const result = LabelFormValidators.labelKeyPrefixLength(control);
    expect(result).toBe(null);
  });

  it('labelKeyPrefixLength should be invalid', () => {
    const control = {value: `${char256}/${char8}`} as FormControl;
    const result = LabelFormValidators.labelKeyPrefixLength(control);
    expect(result).not.toBe(null);
  });
});
