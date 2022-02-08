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

import {NodeProvider, OperatingSystem} from '../model/NodeProviderConstants';

export class Node {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name?: string;
  spec: NodeSpec;
  status?: NodeStatus;
}

export class NodeSpec {
  cloud: NodeCloudSpec;
  operatingSystem: OperatingSystemSpec;
  versions?: NodeVersionInfo;
  sshUserName?: string;
  labels?: object;
  taints?: Taint[];
}

export class Taint {
  static NO_SCHEDULE = 'NoSchedule';
  static PREFER_NO_SCHEDULE = 'PreferNoSchedule';
  static NO_EXECUTE = 'NoExecute';

  static getAvailableEffects(): string[] {
    return [Taint.NO_SCHEDULE, Taint.PREFER_NO_SCHEDULE, Taint.NO_EXECUTE];
  }

  key: string;
  value: string;
  effect: string;
}

export class NodeCloudSpec {
  digitalocean?: DigitaloceanNodeSpec;
  aws?: AWSNodeSpec;
  openstack?: OpenstackNodeSpec;
  packet?: EquinixNodeSpec;
  hetzner?: HetznerNodeSpec;
  vsphere?: VSphereNodeSpec;
  azure?: AzureNodeSpec;
  gcp?: GCPNodeSpec;
  kubevirt?: KubeVirtNodeSpec;
  nutanix?: NutanixNodeSpec;
  alibaba?: AlibabaNodeSpec;
  anexia?: AnexiaNodeSpec;
}

export class OperatingSystemSpec {
  ubuntu?: UbuntuSpec;
  centos?: CentosSpec;
  sles?: SLESSpec;
  rhel?: RHELSpec;
  flatcar?: FlatcarSpec;

  static getOperatingSystem(spec: OperatingSystemSpec): OperatingSystem {
    return Object.keys(spec).find(key => spec[key] !== undefined) as OperatingSystem;
  }
}

export class UbuntuSpec {
  distUpgradeOnBoot: boolean;
}

export class CentosSpec {
  distUpgradeOnBoot: boolean;
}

export class FlatcarSpec {
  disableAutoUpdate: boolean;
}

export class SLESSpec {
  distUpgradeOnBoot: boolean;
}

export class RHELSpec {
  distUpgradeOnBoot: boolean;
  rhelSubscriptionManagerUser?: string;
  rhelSubscriptionManagerPassword?: string;
  rhsmOfflineToken?: string;
}

export class NodeVersionInfo {
  kubelet?: string;
}

export class NodeStatus {
  machineName?: string;
  capacity?: NodeResources;
  allocatable?: NodeResources;
  addresses?: NodeAddress[];
  nodeInfo?: NodeSystemInfo;
  errorReason?: string;
  errorMessage?: string;
}

export class NodeResources {
  cpu: string;
  memory: string;
}

export class NodeAddress {
  type: string;
  address: string;
}

export class NodeSystemInfo {
  kernelVersion: string;
  kubeletVersion: string;
  operatingSystem: string;
  architecture: string;
  containerRuntimeVersion: string;
}

export class AnexiaNodeSpec {
  vlanID: string;
  templateID: string;
  cpus: number;
  memory: number;
  diskSize: number;
}

export class AlibabaNodeSpec {
  instanceType: string;
  diskSize: string;
  diskType: string;
  vSwitchID: string;
  internetMaxBandwidthOut: string;
  labels: object;
  zoneID: string;
}

export class AWSNodeSpec {
  instanceType: string;
  diskSize: number;
  volumeType: string;
  ami: string;
  tags: object;
  subnetID: string;
  availabilityZone: string;
  assignPublicIP?: boolean;
  isSpotInstance?: boolean;
  spotInstanceMaxPrice?: string;
  spotInstancePersistentRequest?: boolean;
}

export class AzureNodeSpec {
  size: string;
  assignPublicIP: boolean;
  tags: object;
  imageID?: string;
  zones: string[];
  osDiskSize: number;
  dataDiskSize: number;
  assignAvailabilitySet: boolean;
}

export class DigitaloceanNodeSpec {
  size: string;
  backups: boolean;
  ipv6: boolean;
  monitoring: boolean;
  tags: string[];
}

export class GCPNodeSpec {
  diskSize: number;
  diskType: string;
  labels: object;
  machineType: string;
  preemptible: boolean;
  tags: string[];
  zone: string;
  customImage?: string;
}

export class HetznerNodeSpec {
  type: string;
  network?: string;
}

export class KubeVirtNodeSpec {
  cpus: string;
  memory: string;
  namespace: string;
  sourceURL: string;
  storageClassName: string;
  pvcSize: string;
}

export class OpenstackNodeSpec {
  flavor: string;
  image: string;
  useFloatingIP: boolean;
  tags: object;
  diskSize?: number;
  availabilityZone?: string;
  instanceReadyCheckPeriod: string;
  instanceReadyCheckTimeout: string;
}

export class EquinixNodeSpec {
  instanceType: string;
  tags: string[];
}

export class NutanixNodeSpec {
  subnetName: string;
  imageName: string;
  categories: object;
  cpus: number;
  cpuCores: number;
  cpuPassthrough: boolean;
  memoryMB: number;
  diskSize: number;
}

export class VSphereNodeSpec {
  cpus: number;
  memory: number;
  template: string;
  diskSizeGB?: number;
}

export function getDefaultNodeProviderSpec(provider: string): object {
  switch (provider) {
    case NodeProvider.AWS:
      return {
        instanceType: '',
        diskSize: 25,
        volumeType: 'standard',
        ami: '',
        tags: {},
        subnetID: '',
        availabilityZone: '',
      } as AWSNodeSpec;
    case NodeProvider.DIGITALOCEAN:
      return {
        size: '',
        backups: false,
        ipv6: false,
        monitoring: false,
        tags: [],
      } as DigitaloceanNodeSpec;
    case NodeProvider.OPENSTACK:
      return {
        flavor: '',
        image: '',
        useFloatingIP: false,
        tags: {},
        instanceReadyCheckPeriod: '5s',
        instanceReadyCheckTimeout: '120s',
      } as OpenstackNodeSpec;
    case NodeProvider.VSPHERE:
      return {
        cpus: 2,
        memory: 4096,
        diskSizeGB: 10,
        template: '',
      } as VSphereNodeSpec;
    case NodeProvider.HETZNER:
      return {
        type: '',
      } as HetznerNodeSpec;
    case NodeProvider.AZURE:
      return {
        size: '',
        assignPublicIP: false,
        tags: {},
      } as AzureNodeSpec;
    case NodeProvider.EQUINIX:
      return {
        instanceType: '',
        tags: [],
      } as EquinixNodeSpec;
    case NodeProvider.GCP:
      return {
        diskSize: 25,
        diskType: '',
        machineType: '',
        preemptible: false,
        zone: '',
        tags: [],
        labels: {},
      } as GCPNodeSpec;
    case NodeProvider.ALIBABA:
      return {
        instanceType: '',
        diskSize: '40',
        diskType: '',
        vSwitchID: '',
        internetMaxBandwidthOut: '10',
        labels: {},
        zoneID: '',
      } as AlibabaNodeSpec;
    case NodeProvider.ANEXIA:
      return {
        vlanID: '',
        templateID: '',
        cpus: 1,
        memory: 2048,
        diskSize: 20,
      } as AnexiaNodeSpec;
    case NodeProvider.KUBEVIRT:
      return {
        cpus: '1',
        memory: '2Gi',
        pvcSize: '10Gi',
        namespace: 'kube-system',
      } as KubeVirtNodeSpec;
    case NodeProvider.NUTANIX:
      return {
        imageName: '',
        subnetName: '',
        cpus: 2,
        cpuCores: 1,
        cpuPassthrough: false,
        memoryMB: 2048,
        diskSize: 20,
      } as NutanixNodeSpec;
  }
  return {};
}

export function getEmptyOperatingSystemSpec(): OperatingSystemSpec {
  return {
    ubuntu: {
      distUpgradeOnBoot: false,
    },
  };
}

export function getEmptyNodeVersionSpec(): NodeVersionInfo {
  return {};
}

export function getOperatingSystem(spec: NodeSpec): string {
  if (spec.operatingSystem.ubuntu) {
    return 'Ubuntu';
  } else if (spec.operatingSystem.centos) {
    return 'CentOS';
  } else if (spec.operatingSystem.sles) {
    return 'SLES';
  } else if (spec.operatingSystem.rhel) {
    return 'RHEL';
  } else if (spec.operatingSystem.flatcar) {
    return 'Flatcar';
  }
  return '';
}

export function getOperatingSystemLogoClass(spec: NodeSpec): string {
  if (spec.operatingSystem.ubuntu) {
    return 'ubuntu';
  } else if (spec.operatingSystem.centos) {
    return 'centos';
  } else if (spec.operatingSystem.sles) {
    return 'sles';
  } else if (spec.operatingSystem.rhel) {
    return 'rhel';
  } else if (spec.operatingSystem.flatcar) {
    return 'flatcar';
  }
  return '';
}
