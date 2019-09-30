import {AbstractControl} from '@angular/forms';
import * as _ from 'lodash';

export function objectDiff(object: any, base: any): any {
  return _.transform(object, (result, value, key) => {
    if (!_.isEqual(value, base[key])) {
      result[key] = (_.isObject(value) && _.isObject(base[key])) ? objectDiff(value, base[key]) : value;
    }
  });
}

export function objectFromForm(control: AbstractControl, allowEmptyValue = true, returnNullIfEmpty = true): {}|null {
  const object = {};
  for (const i in control.value) {
    if (control.value[i].key !== '' && (control.value[i].value !== '' || allowEmptyValue)) {
      object[control.value[i].key] = control.value[i].value;
    }
  }
  return _.isEqual(object, {}) && returnNullIfEmpty ? null : object;
}
