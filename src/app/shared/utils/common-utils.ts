// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as _ from 'lodash';

export function objectDiff(object: any, base: any): any {
  return _.transform(object, (result, value, key) => {
    if (!_.isEqualWith(value, base[key], comparator)) {
      result[key] = _.isObject(value) && _.isObject(base[key]) ? objectDiff(value, base[key]) : value;
    }
  });
}

function comparator(baseValue, value): boolean {
  if (_.isArray(baseValue) && _.isArray(value)) {
    return _.isEqual(baseValue.sort(), value.sort());
  }

  return _.isEqual(baseValue, value);
}

export function isObjectEmpty(obj: object): boolean {
  if (!!obj && typeof obj === 'object') {
    return Object.values(obj).every(value => isObjectEmpty(value));
  }

  return !obj;
}

export function compare(a: number, b: number): -1 | 0 | 1 {
  return a < b ? -1 : a !== b ? 1 : 0;
}

export function getIconClassForButton(type: string): string {
  switch (type) {
    case 'Add':
      return 'km-icon-mask km-icon-add';
    case 'Edit':
      return 'km-icon-mask km-icon-edit w-24';
    case 'Delete':
      return 'km-icon-mask km-icon-delete with-text';
    case 'Start':
      return 'km-icon-mask km-icon-check i-24';
    case 'Regenerate':
    case 'Restart':
      return 'km-icon-mask km-icon-regenerate w-24';
    case 'Reset':
      return 'km-icon-mask km-icon-reset w-24';
    case 'Disconnect':
      return 'km-icon-mask km-icon-disconnect w-24';
    default:
      return '';
  }
}
