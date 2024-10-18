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

import {
  KubeVirtAffinityPreset,
  KubeVirtNodeInstanceType,
  KubeVirtNodePreference,
  KubeVirtTopologySpreadConstraint,
} from '@shared/entity/provider/kubevirt';
import {VMwareCloudDirectorIPAllocationMode} from '@shared/entity/provider/vmware-cloud-director';
import {NodeProvider, OperatingSystem} from '../model/NodeProviderConstants';

export class Node {
  annotations?: Record<string, string>;
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name?: string;
  spec: NodeSpec;
  status?: NodeStatus;
}

export class NodeSpec {
  annotations?: Record<string, string>;
  cloud: NodeCloudSpec;
  operatingSystem: OperatingSystemSpec;
  network?: NodeNetworkSpec;
  versions?: NodeVersionInfo;
  sshUserName?: string;
  labels?: Record<string, string>;
  taints?: Taint[];
}

export class NodeNetworkSpec {
  cidr?: string;
  gateway?: string;
  dns?: DNSSpec;
  ipFamily?: string;
}

export class DNSSpec {
  servers: string[];
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
  vmwareclouddirector?: VMwareCloudDirectorNodeSpec;
  edge?: EdgeNodeSpec;
  baremetal?: BaremetalNodeSpec;
}

export class OperatingSystemSpec {
  amzn2?: Amzn2Spec;
  centos?: CentosSpec;
  flatcar?: FlatcarSpec;
  rhel?: RHELSpec;
  rockylinux?: RockyLinuxSpec;
  ubuntu?: UbuntuSpec;

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

export class Amzn2Spec {
  distUpgradeOnBoot: boolean;
}

export class FlatcarSpec {
  disableAutoUpdate: boolean;
}

export class RHELSpec {
  distUpgradeOnBoot: boolean;
  rhelSubscriptionManagerUser?: string;
  rhelSubscriptionManagerPassword?: string;
  rhsmOfflineToken?: string;
}

export class RockyLinuxSpec {
  distUpgradeOnBoot: boolean;
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

export class NodeIPAddress {
  internalIPs: string[] = [];
  externalIPs: string[] = [];
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
  template: string;
  cpus: number;
  memory: number;
  diskSize: number;
  disks: AnexiaNodeSpecDisk[];
}

export class AnexiaNodeSpecDisk {
  size: number;
  performanceType?: string;
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
  ebsVolumeEncrypted?: boolean;
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
  enableAcceleratedNetworking: boolean;
}

export class DigitaloceanNodeSpec {
  size: string;
  backups: boolean;
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
  name: string;
  instancetype?: KubeVirtNodeInstanceType;
  preference?: KubeVirtNodePreference;
  subnet?: string;
  flavorProfile: string;
  cpus?: string;
  memory?: string;
  primaryDiskOSImage: string;
  primaryDiskStorageClassName: string;
  primaryDiskSize: string;
  nodeAffinityPreset?: KubeVirtNodeAffinityPreset;
  topologySpreadConstraints?: KubeVirtTopologySpreadConstraint[];
}

export class KubeVirtNodeAffinityPreset {
  Type: KubeVirtAffinityPreset;
  Key?: string;
  Values?: string[];
}

export class OpenstackNodeSpec {
  flavor: string;
  serverGroup: string;
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
  tags?: VSphereTag[];
  vmAntiAffinity: boolean;
  vmGroup?: string;
}

export class VSphereTag {
  categoryID: string;
  id?: string;
  name?: string;
  description?: string;
}

export class VMwareCloudDirectorNodeSpec {
  cpus: number;
  cpuCores: number;
  memoryMB: number;
  diskSizeGB: number;
  diskIOPS?: number;
  storageProfile: string;
  ipAllocationMode: string;
  vapp?: string;
  catalog: string;
  network?: string;
  template: string;
  placementPolicy?: string;
  sizingPolicy?: string;
}

export class EdgeNodeSpec {}

export class BaremetalNodeSpec {
  tinkerbell: BaremetalTinkerbellNodeSpec;
}

export class BaremetalTinkerbellNodeSpec {
  hardwareRef: BaremetalTinkerbellHardwareRef;
  osImageUrl: string;
}

export class BaremetalTinkerbellHardwareRef {
  Name: string;
  Namespace: string;
}

// eslint-disable-next-line complexity
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
      } as AnexiaNodeSpec;
    case NodeProvider.KUBEVIRT:
      return {
        primaryDiskSize: '10',
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
    case NodeProvider.VMWARECLOUDDIRECTOR:
      return {
        cpus: 2,
        cpuCores: 1,
        memoryMB: 2048,
        diskSizeGB: 20,
        storageProfile: '',
        diskIOPS: 0,
        ipAllocationMode: VMwareCloudDirectorIPAllocationMode.DHCP,
        catalog: '',
        template: '',
      } as VMwareCloudDirectorNodeSpec;
    case NodeProvider.EDGE:
      return {} as EdgeNodeSpec;
    case NodeProvider.BAREMETAL:
      return {
        tinkerbell: {
          hardwareRef: {
            Name: '',
            Namespace: '',
          },
          osImageUrl: '',
        },
      } as BaremetalNodeSpec;
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
  } else if (spec.operatingSystem.rhel) {
    return 'RHEL';
  } else if (spec.operatingSystem.flatcar) {
    return 'Flatcar';
  } else if (spec.operatingSystem.rockylinux) {
    return 'Rocky Linux';
  } else if (spec.operatingSystem.amzn2) {
    return 'Amazon Linux 2';
  }
  return '';
}

export function getOperatingSystemLogoClass(spec: NodeSpec): string {
  if (spec.operatingSystem.ubuntu) {
    return 'ubuntu';
  } else if (spec.operatingSystem.centos) {
    return 'centos';
  } else if (spec.operatingSystem.rhel) {
    return 'rhel';
  } else if (spec.operatingSystem.flatcar) {
    return 'flatcar';
  } else if (spec.operatingSystem.rockylinux) {
    return 'rockylinux';
  } else if (spec.operatingSystem.amzn2) {
    return 'amazon-linux-2';
  }
  return '';
}
