import {NodeProvider, OperatingSystem} from '../model/NodeProviderConstants';

import {AlibabaNodeSpec} from './node/AlibabaNodeSpec';
import {AWSNodeSpec} from './node/AWSNodeSpec';
import {AzureNodeSpec} from './node/AzureNodeSpec';
import {DigitaloceanNodeSpec} from './node/DigitaloceanNodeSpec';
import {GCPNodeSpec} from './node/GCPNodeSpec';
import {HetznerNodeSpec} from './node/HetznerNodeSpec';
import {KubeVirtNodeSpec} from './node/KubeVirtNodeSpec';
import {OpenstackNodeSpec} from './node/OpenstackNodeSpec';
import {PacketNodeSpec} from './node/PacketNodeSpec';
import {VSphereNodeSpec} from './node/VSphereNodeSpec';

export class NodeEntity {
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
  packet?: PacketNodeSpec;
  hetzner?: HetznerNodeSpec;
  vsphere?: VSphereNodeSpec;
  azure?: AzureNodeSpec;
  gcp?: GCPNodeSpec;
  kubevirt?: KubeVirtNodeSpec;
  alibaba?: AlibabaNodeSpec;
}

export class OperatingSystemSpec {
  ubuntu?: UbuntuSpec;
  centos?: CentosSpec;
  containerLinux?: ContainerLinuxSpec;
  sles?: SLESSpec;

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

export class ContainerLinuxSpec {
  disableAutoUpdate: boolean;
}

export class SLESSpec {
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

export class NodeSystemInfo {
  kernelVersion: string;
  kubeletVersion: string;
  operatingSystem: string;
  architecture: string;
  containerRuntimeVersion: string;
}

export function getEmptyNodeProviderSpec(provider: string): object {
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
      } as OpenstackNodeSpec;
    case NodeProvider.VSPHERE:
      return {
        cpus: 2,
        memory: 4096,
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
    case NodeProvider.PACKET:
      return {
        instanceType: '',
        tags: [],
      } as PacketNodeSpec;
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
