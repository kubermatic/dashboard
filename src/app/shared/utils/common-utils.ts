import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
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

export function addKeyValuePair(): FormGroup {
  return new FormGroup({
    key: new FormControl(''),
    value: new FormControl(''),
  });
}

export function filterArrayOptions(value: string, field: string, options: any): any {
  const filterValue = value.toLowerCase();
  return options.filter(option => option[field].toLowerCase().includes(filterValue));
}

export function filterObjectOptions(value: string, field: string, options: any): any {
  const result = {};
  const filterValue = value.toLowerCase();
  Object.keys(options).forEach(key => {
    result[key] = options[key].filter(option => option[field].toLowerCase().includes(filterValue));
  });
  return result;
}
