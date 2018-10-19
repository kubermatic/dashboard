import { AbstractControl, ValidatorFn } from '@angular/forms';
import { ClusterEntity } from '../entity/ClusterEntity';

// NoIpsLeftValidator will validate if there are enough ips left to create given amount of nodes
// a cluster could have more than one ip ranges
// if gateway ip is in ip range we have to substract it from ipCount
export function NoIpsLeftValidator(cluster: ClusterEntity, existingNodes: number): ValidatorFn {
  // tslint:disable:no-bitwise
  const ip4ToInt = ip => ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;

  const isIp4InCidr = (ip, cidr) => {
    const [range, bits = 32] = cidr.split('/');
    const mask = ~(2 ** (32 - bits) - 1);
    return (ip4ToInt(ip) & mask) === (ip4ToInt(range) & mask);
  };
  // tslint:enable:no-bitwise
  return (control: AbstractControl): {[key: string]: boolean} | null => {
    if (!!cluster.spec.machineNetworks) {
      let ipCount = 0;

      for (const i in cluster.spec.machineNetworks) {
        if (cluster.spec.machineNetworks.hasOwnProperty(i)) {
          const isInCidr = isIp4InCidr(cluster.spec.machineNetworks[i].gateway, cluster.spec.machineNetworks[i].cidr);
          const cidr = +cluster.spec.machineNetworks[i].cidr.split('/')[1];
          if (isInCidr) {
            ipCount += ( 2 ** ( 32 - cidr )) - 3;
          } else {
            ipCount += ( 2 ** ( 32 - cidr )) - 2;
          }
        }
      }

      if (!!ipCount && ipCount > 0) {
        if ((ipCount - existingNodes - control.value) >= 0) {
          return null;
        } else {
          return {'ipsMissing': true};
        }
      }
    } else {
      return null;
    }
  };
}
