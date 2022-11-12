// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {MachineNetwork} from '../entity/cluster';

/* eslint-disable @typescript-eslint/no-magic-numbers */
export function getIpCount(networks: MachineNetwork[]): number {
  const ip4ToInt = ip => ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;

  const isIp4InCidr = (ip, cidr) => {
    const [range, bits = 32] = cidr.split('/');
    const mask = ~(2 ** (32 - bits) - 1);
    return (ip4ToInt(ip) & mask) === (ip4ToInt(range) & mask);
  };
  let ipCount = 0;

  for (const i in networks) {
    if (Object.prototype.hasOwnProperty.call(networks, i)) {
      const isInCidr = isIp4InCidr(networks[i].gateway, networks[i].cidr);
      const cidr = +networks[i].cidr.split('/')[1];
      if (isInCidr) {
        ipCount += 2 ** (32 - cidr) - 3;
      } else {
        ipCount += 2 ** (32 - cidr) - 2;
      }
    }
  }

  return ipCount;
}
