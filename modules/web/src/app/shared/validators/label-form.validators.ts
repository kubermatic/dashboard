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
import _ from 'lodash';

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
    const maxLength = 63;
    return labelKeyName.length <= maxLength ? null : {validLabelKeyPrefixLength: {value: true}};
  }

  /**
   * Checks if label key prefix (before the "/" if there is one) is not longer than 253 chars.
   */
  static labelKeyPrefixLength(control: FormControl): {[key: string]: object} {
    const value = control.value;
    const slashPosition = value.indexOf('/');
    const labelKeyPrefix = slashPosition > -1 ? value.substring(0, slashPosition) : '';
    const maxLength = 253;
    return labelKeyPrefix.length <= maxLength ? null : {validLabelKeyPrefixLength: {value: true}};
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
    const maxLength = 63;
    if (_.isArray(value)) {
      let err = null;

      value.forEach(val => {
        if (val.length > maxLength) {
          err = {validLabelValueLength: {value: true}};
        }
      });
      return err;
    }

    return value.length <= maxLength ? null : {validLabelValueLength: {value: true}};
  }

  /**
   * Checks if the label value contains only allowed chars.
   */
  static labelValuePattern(control: FormControl): {[key: string]: object} {
    const value = control.value;
    const labelValuePattern = /^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$/;
    if (_.isArray(value)) {
      let err = null;

      value.forEach(val => {
        if (!labelValuePattern.test(val)) {
          err = {validLabelValuePattern: {value: true}};
        }
      });
      return err;
    }
    return labelValuePattern.test(value) ? null : {validLabelValuePattern: {value: true}};
  }
}
