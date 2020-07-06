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

import {FormControl} from '@angular/forms';

export class AutocompleteFilterValidators {
  static mustBeInArrayList = (list: any[], key: string, isRequired: boolean) => {
    return (control: FormControl) => {
      let isInside = false;
      const valueToCompare: string | boolean =
        typeof control['value'] === 'object'
          ? control['value'][key].toLowerCase()
          : typeof control['value'] === 'string'
          ? control['value'].toLowerCase()
          : false;

      if (!isRequired && valueToCompare === '') {
        isInside = true;
      }

      if (!!isRequired && list.length === 0 && valueToCompare !== '') {
        isInside = true;
      }

      if (list.length > 0) {
        list.forEach(entry => {
          const currentValue: string = entry[key].toLowerCase();
          if (currentValue === valueToCompare) {
            isInside = true;
          }
        });
      }

      return isInside ? null : {mustBeInList: {valid: false}};
    };
  };

  static mustBeInObjectList = (list: any, key: string, isRequired: boolean) => {
    return (control: FormControl) => {
      let isInside = false;
      const valueToCompare: string | boolean =
        typeof control['value'] === 'object'
          ? control['value'][key].toLowerCase()
          : typeof control['value'] === 'string'
          ? control['value']
          : false;

      if (!isRequired && valueToCompare === '') {
        isInside = true;
      }

      if (!!isRequired && Object.keys(list).length === 0 && valueToCompare !== '') {
        isInside = true;
      }

      if (Object.keys(list).length > 0) {
        Object.keys(list).forEach(entry => {
          for (const i of list[entry]) {
            if (i[key] === valueToCompare) {
              isInside = true;
            }
          }
        });
      }

      return isInside ? null : {mustBeInList: {valid: false}};
    };
  };
}
