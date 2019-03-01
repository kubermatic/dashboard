import {FormControl} from '@angular/forms';

/**
 * Validation on the frontend side is required to avoid errors when sending labels to the cluster.
 * Read more: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-set
 */
export class LabelFormValidators {
  /**
   * Checks if label key name (after the "/" if there is one) is not longer than 63 chars.
   */
  static labelKeyNameLength(control: FormControl): {[key: string]: object} {
    const value = control.value;
    const slashPosition = value.indexOf('/');
    const labelKeyName = slashPosition > -1 ? value.substring(slashPosition + 1) : value;
    return labelKeyName.length <= 63 ? null : {validLabelKeyPrefixLength: {value: true}};
  }

  /**
   * Checks if label key prefix (before the "/" if there is one) is not longer than 253 chars.
   */
  static labelKeyPrefixLength(control: FormControl): {[key: string]: object} {
    const value = control.value;
    const slashPosition = value.indexOf('/');
    const labelKeyPrefix = slashPosition > -1 ? value.substring(0, slashPosition) : '';
    return labelKeyPrefix.length <= 253 ? null : {validLabelKeyPrefixLength: {value: true}};
  }

  /**
   * Checks if the label key name (after the "/" if there is one) contains only allowed chars.
   */
  static labelKeyNamePattern(control: FormControl): {[key: string]: object} {
    const value = control.value;
    const labelKeyNamePattern = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
    const slashPosition = value.indexOf('/');
    const labelKeyName = slashPosition > -1 ? value.substring(slashPosition + 1) : value;
    return labelKeyNamePattern.test(labelKeyName) || value === '' ? null : {validLabelKeyNamePattern: {value: true}};
  }

  /**
   * Checks if the label key prefix (before the "/" if there is one) contains only allowed chars.
   */
  static labelKeyPrefixPattern(control: FormControl): {[key: string]: object} {
    const value = control.value;
    const labelKeyPrefixPattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
    const slashPosition = value.indexOf('/');
    const isValid = slashPosition > -1 ? labelKeyPrefixPattern.test(value.substring(0, slashPosition)) : true;
    return isValid ? null : {validLabelKeyPrefixPattern: {value: true}};
  }

  /**
   * Checks if label value is not longer than 63 chars.
   */
  static labelValueLength(control: FormControl): {[key: string]: object} {
    const value = control.value;
    return value.length <= 63 ? null : {validLabelValueLength: {value: true}};
  }

  /**
   * Checks if the label value contains only allowed chars.
   */
  static labelValuePattern(control: FormControl): {[key: string]: object} {
    const value = control.value;
    const labelValuePattern = /^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$/;
    return labelValuePattern.test(value) ? null : {validLabelValuePattern: {value: true}};
  }
}
