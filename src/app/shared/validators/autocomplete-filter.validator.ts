import {FormControl} from '@angular/forms';

export class AutocompleteFilterValidators {
  static arrayMustBeInList =
      (list: any[], key: string, isRequired: boolean) => {
        return (control: FormControl) => {
          let isInside = false;
          const valueToCompare: string|boolean = typeof control['value'] === 'object' ?
              control['value'][key].toLowerCase() :
              typeof control['value'] === 'string' ? control['value'] : false;

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

          if (isInside) {
            return null;
          } else {
            return {mustBeInList: {valid: false}};
          }
        };
      }

  static objectMustBeInList = (list: any, key: string, isRequired: boolean) => {
    return (control: FormControl) => {
      let isInside = false;
      const valueToCompare: string|boolean = typeof control['value'] === 'object' ?
          control['value'][key].toLowerCase() :
          typeof control['value'] === 'string' ? control['value'] : false;

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

      if (isInside) {
        return null;
      } else {
        return {mustBeInList: {valid: false}};
      }
    };
  }
}
