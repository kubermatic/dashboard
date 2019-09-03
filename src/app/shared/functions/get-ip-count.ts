import {MachineNetwork} from '../entity/ClusterEntity';

export function getIpCount(networks: MachineNetwork[]): number {
  // tslint:disable
  const ip4ToInt = (ip) => (ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0);

  const isIp4InCidr = (ip, cidr) => {
    const [range, bits = 32] = cidr.split('/');
    const mask = ~(2 ** (32 - bits) - 1);
    return (ip4ToInt(ip) & mask) === (ip4ToInt(range) & mask);
  };
  // tslint:enable
  let ipCount = 0;

  for (const i in networks) {
    if (networks.hasOwnProperty(i)) {
      const isInCidr = isIp4InCidr(networks[i].gateway, networks[i].cidr);
      const cidr = +networks[i].cidr.split('/')[1];
      if (isInCidr) {
        ipCount += (2 ** (32 - cidr)) - 3;
      } else {
        ipCount += (2 ** (32 - cidr)) - 2;
      }
    }
  }

  return ipCount;
}
