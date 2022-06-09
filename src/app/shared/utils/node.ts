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

import {Node, NodeIPAddress} from '../entity/node';

export class NodeUtils {
  static getFormattedNodeMemory(memory: string): string {
    const memRE = /([0-9]+)([a-zA-Z])i/;
    const resRE = memory.match(memRE);
    const base = 1024;
    const radix = 10;
    const fractionDigits = 2;

    let nodeCapacity;
    const prefixes = ['Ki', 'Mi', 'Gi', 'Ti'];
    let i = 0;

    if (resRE) {
      let ki = parseInt(resRE[1], radix);
      do {
        ki /= base;
        i++;
      } while (ki > 1);
      nodeCapacity = (ki * base).toFixed(fractionDigits);
    }

    return nodeCapacity ? `${nodeCapacity} ${prefixes[i - 1]}` : 'unknown';
  }

  static getAddresses(node: Node): NodeIPAddress {
    const addresses = new NodeIPAddress();
    for (const i in node.status.addresses) {
      if (node.status.addresses[i].type === 'InternalIP') {
        addresses.internalIPs = [...addresses.internalIPs, node.status.addresses[i].address];
      } else if (node.status.addresses[i].type === 'ExternalIP') {
        addresses.externalIP = node.status.addresses[i].address;
      }
    }
    return addresses;
  }
}
