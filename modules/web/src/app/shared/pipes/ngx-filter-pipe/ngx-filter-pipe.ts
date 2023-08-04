// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filterBy',
  pure: false,
})
export class FilterPipe implements PipeTransform {
  static isFoundOnWalking(value: any, key: any): boolean {
    let walker = value;
    let found = false;
    do {
      if (Object.prototype.hasOwnProperty.call(walker, key) || Object.getOwnPropertyDescriptor(walker, key)) {
        found = true;
        break;
      }
    } while ((walker = Object.getPrototypeOf(walker)));
    return found;
  }

  static isNumber(value: any): boolean {
    return !isNaN(parseInt(value, 10)) && isFinite(value);
  }

  /**
   * Checks function's value if type is function otherwise same value
   */
  static getValue(value: any): any {
    return typeof value === 'function' ? value() : value;
  }

  private filterByString(filter: any) {
    if (filter) {
      filter = filter.toLowerCase();
    }
    return function (value) {
      return !filter || (value ? ('' + value).toLowerCase().indexOf(filter) !== -1 : false);
    };
  }

  private filterByBoolean(filter: any) {
    return function (value) {
      return Boolean(value) === filter;
    };
  }

  private filterByObject(filter: any) {
    return value => {
      for (const key in filter) {
        if (key === '$or') {
          if (!this.filterByOr(filter.$or)(FilterPipe.getValue(value))) {
            return false;
          }
          continue;
        }
        if (!value || !FilterPipe.isFoundOnWalking(value, key)) {
          return false;
        }
        if (!this.isMatching(filter[key], FilterPipe.getValue(value[key]))) {
          return false;
        }
      }
      return true;
    };
  }

  private isMatching(filter, val) {
    switch (typeof filter) {
      case 'boolean':
        return this.filterByBoolean(filter)(val);
      case 'string':
        return this.filterByString(filter)(val);
      case 'object':
        return this.filterByObject(filter)(val);
    }
    return this.filterDefault(filter)(val);
  }

  /**
   * Filter value by $or
   */
  private filterByOr(filter: any[]): (value: any) => boolean {
    return (value: any) => {
      const length = filter.length;

      const arrayComparison = i => value.indexOf(filter[i]) !== -1;
      const otherComparison = i => this.isMatching(filter[i], value);
      const comparison = Array.isArray(value) ? arrayComparison : otherComparison;

      for (let i = 0; i < length; i++) {
        if (comparison(i)) {
          return true;
        }
      }

      return false;
    };
  }

  /**
   * Default filterDefault function
   */
  private filterDefault(filter: any): (value: any) => boolean {
    return (value: any) => filter === undefined || filter === value;
  }

  transform(array: any[], filter: any): any {
    if (!array) {
      return array;
    }
    switch (typeof filter) {
      case 'boolean':
        return array.filter(this.filterByBoolean(filter));
      case 'string':
        if (FilterPipe.isNumber(filter)) {
          return array.filter(this.filterDefault(filter));
        }
        return array.filter(this.filterByString(filter));
      case 'object':
        return array.filter(this.filterByObject(filter));
      case 'function':
        return array.filter(filter);
    }
    return array.filter(this.filterDefault(filter));
  }
}
