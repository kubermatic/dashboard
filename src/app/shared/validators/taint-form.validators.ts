import {FormControl} from '@angular/forms';
import {Taint} from '../entity/NodeEntity';

export class TaintFormValidators {
  /**
   * Checks if taint value is not longer than 63 chars.
   */
  static taintValueLength(control: FormControl): {[key: string]: object} {
    const value = control.value;
    return value.length <= 63 ? null : {validLabelValueLength: {value: true}};
  }

  /**
   * Checks if the effect of a taint is valid.
   */
  static taintValidEffect(control: FormControl): {[key: string]: object} {
    const value = control.value;
    return Taint.getAvailableEffects().includes(value) ? null : {validTaintEffect: {value: true}};
  }
}
