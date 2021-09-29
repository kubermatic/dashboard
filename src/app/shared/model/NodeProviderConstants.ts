// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NodeSpec} from '../entity/node';

export enum NodeProvider {
  ALIBABA = 'alibaba',
  ANEXIA = 'anexia',
  AWS = 'aws',
  AZURE = 'azure',
  DIGITALOCEAN = 'digitalocean',
  BAREMETAL = 'baremetal',
  BRINGYOUROWN = 'bringyourown',
  GCP = 'gcp',
  HETZNER = 'hetzner',
  OPENSTACK = 'openstack',
  EQUINIX = 'packet',
  KUBEVIRT = 'kubevirt',
  VSPHERE = 'vsphere',
  NONE = '',
}

export enum OperatingSystem {
  Ubuntu = 'ubuntu',
  CentOS = 'centos',
  SLES = 'sles',
  RHEL = 'rhel',
  Flatcar = 'flatcar',
}

export namespace NodeProviderConstants {
  const PROVIDER_DISPLAY_NAMES = new Map<NodeProvider, string>([
    [NodeProvider.ALIBABA, 'Alibaba'],
    [NodeProvider.ANEXIA, 'Anexia'],
    [NodeProvider.AWS, 'AWS'],
    [NodeProvider.AZURE, 'Azure'],
    [NodeProvider.BAREMETAL, 'Bare-metal'],
    [NodeProvider.BRINGYOUROWN, 'BringYourOwn'],
    [NodeProvider.DIGITALOCEAN, 'DigitalOcean'],
    [NodeProvider.GCP, 'Google Cloud'],
    [NodeProvider.HETZNER, 'Hetzner'],
    [NodeProvider.KUBEVIRT, 'KubeVirt'],
    [NodeProvider.OPENSTACK, 'Openstack'],
    [NodeProvider.EQUINIX, 'Equinix Metal'],
    [NodeProvider.VSPHERE, 'VSphere'],
  ]);

  export function displayName(provider: NodeProvider): string {
    return PROVIDER_DISPLAY_NAMES.get(provider);
  }

  export function newNodeProvider(provider: string): NodeProvider {
    const result = Object.values(NodeProvider).find(np => np === provider);
    return result ? result : NodeProvider.NONE;
  }

  export function getOperatingSystemSpecName(spec: NodeSpec) {
    if (spec.operatingSystem.ubuntu) {
      return OperatingSystem.Ubuntu;
    } else if (spec.operatingSystem.centos) {
      return OperatingSystem.CentOS;
    } else if (spec.operatingSystem.sles) {
      return OperatingSystem.SLES;
    } else if (spec.operatingSystem.rhel) {
      return OperatingSystem.RHEL;
    } else if (spec.operatingSystem.flatcar) {
      return OperatingSystem.Flatcar;
    }
    return '';
  }
}
