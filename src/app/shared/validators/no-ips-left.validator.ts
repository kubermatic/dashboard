import {AbstractControl, ValidatorFn} from '@angular/forms';
import {MachineNetwork} from '../entity/ClusterEntity';
import {getIpCount} from '../functions/get-ip-count';

// NoIpsLeftValidator will validate if there are enough ips left to create given amount of nodes
// a cluster could have more than one ip ranges
// if gateway ip is in ip range we have to substract it from ipCount
export function NoIpsLeftValidator(
  networks: MachineNetwork[],
  existingNodes: number
): ValidatorFn {
  return (control: AbstractControl): {[key: string]: boolean} | null => {
    if (networks) {
      const ipCount = getIpCount(networks);

      if (!!ipCount && ipCount > 0) {
        if (ipCount - existingNodes - control.value >= 0) {
          return null;
        } else {
          return {ipsMissing: true};
        }
      }
    } else {
      return null;
    }
  };
}
