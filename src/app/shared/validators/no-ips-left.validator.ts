import {AbstractControl, ValidatorFn} from '@angular/forms';
import {ClusterEntity} from '../entity/ClusterEntity';
import {getIpCount} from '../functions/get-ip-count';

// NoIpsLeftValidator will validate if there are enough ips left to create given amount of nodes
// a cluster could have more than one ip ranges
// if gateway ip is in ip range we have to substract it from ipCount
export function NoIpsLeftValidator(cluster: ClusterEntity, existingNodes: number): ValidatorFn {
  return (control: AbstractControl): {[key: string]: boolean}|null => {
    if (!!cluster.spec.machineNetworks) {
      const ipCount = getIpCount(cluster);

      if (!!ipCount && ipCount > 0) {
        if ((ipCount - existingNodes - control.value) >= 0) {
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
