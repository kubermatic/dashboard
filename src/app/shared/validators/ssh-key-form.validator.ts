import {FormControl, ValidatorFn} from '@angular/forms';

/**
 * Validation on the frontend part allows to avoid unnecessary backend calls.
 * Read more: https://tools.ietf.org/html/rfc4253#section-6.6
 */
export function SSHKeyFormValidator(): ValidatorFn {
  return (control: FormControl): any => {
    const splitForm = control.value.toString().trim().split(' ');


    if (splitForm.length < 2 || splitForm.length > 3) {
      return {validSSHKey: true};  // Key type and encoded data are required. Comment part is optional.
    }

    try {
      window.atob((splitForm[1]));
    } catch (err) {
      return {validSSHKey: true};  // Not able to decode SSH key.
    }

    return null;
  };
}
