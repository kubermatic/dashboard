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

import {NodeSpec} from '../entity/node';

export enum NodeProvider {
  AKS = 'aks',
  ALIBABA = 'alibaba',
  ANEXIA = 'anexia',
  AWS = 'aws',
  AZURE = 'azure',
  DIGITALOCEAN = 'digitalocean',
  EKS = 'eks',
  BRINGYOUROWN = 'bringyourown',
  GCP = 'gcp',
  GKE = 'gke',
  HETZNER = 'hetzner',
  OPENSTACK = 'openstack',
  EQUINIX = 'packet',
  KUBEVIRT = 'kubevirt',
  NUTANIX = 'nutanix',
  VSPHERE = 'vsphere',
  NONE = '',
}

export const EXTERNAL_NODE_PROVIDERS = [NodeProvider.AKS, NodeProvider.EKS, NodeProvider.GKE];

export const INTERNAL_NODE_PROVIDERS = Object.values(NodeProvider).filter(
  provider => !!provider && !EXTERNAL_NODE_PROVIDERS.includes(provider)
);

export const NODE_PROVIDERS = [...INTERNAL_NODE_PROVIDERS, ...EXTERNAL_NODE_PROVIDERS];

export enum OperatingSystem {
  Ubuntu = 'ubuntu',
  CentOS = 'centos',
  SLES = 'sles',
  RHEL = 'rhel',
  Flatcar = 'flatcar',
  RockyLinux = 'rockylinux',
}

export namespace NodeProviderConstants {
  const PROVIDER_DISPLAY_NAMES = new Map<NodeProvider, string>([
    [NodeProvider.ALIBABA, 'Alibaba'],
    [NodeProvider.ANEXIA, 'Anexia'],
    [NodeProvider.AWS, 'AWS'],
    [NodeProvider.AZURE, 'Azure'],
    [NodeProvider.BRINGYOUROWN, 'BringYourOwn'],
    [NodeProvider.DIGITALOCEAN, 'DigitalOcean'],
    [NodeProvider.GCP, 'Google Cloud'],
    [NodeProvider.HETZNER, 'Hetzner'],
    [NodeProvider.KUBEVIRT, 'KubeVirt'],
    [NodeProvider.OPENSTACK, 'Openstack'],
    [NodeProvider.EQUINIX, 'Equinix Metal'],
    [NodeProvider.VSPHERE, 'VSphere'],
    [NodeProvider.NUTANIX, 'Nutanix'],
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
    } else if (spec.operatingSystem.rockylinux) {
      return OperatingSystem.RockyLinux;
    }
    return '';
  }
}
