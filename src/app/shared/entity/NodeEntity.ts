import {NodeProvider} from '../model/NodeProviderConstants';

import {AWSNodeSpec} from './node/AWSNodeSpec';
import {AzureNodeSpec} from './node/AzureNodeSpec';
import {DigitaloceanNodeSpec} from './node/DigitaloceanNodeSpec';
import {GCPNodeSpec} from './node/GCPNodeSpec';
import {HetznerNodeSpec} from './node/HetznerNodeSpec';
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
}

export class OperatingSystemSpec {
  ubuntu?: UbuntuSpec;
  centos?: CentosSpec;
  containerLinux?: ContainerLinuxSpec;
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
        tags: {'': ''},
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
        tags: {'': ''},
      } as OpenstackNodeSpec;
    case NodeProvider.VSPHERE:
      return {
        cpus: 1,
        memory: 512,
        template: 'ubuntu-template',
      } as VSphereNodeSpec;
    case NodeProvider.HETZNER:
      return {
        type: '',
      } as HetznerNodeSpec;
    case NodeProvider.AZURE:
      return {
        size: '',
        assignPublicIP: false,
        tags: {'': ''},
      } as AzureNodeSpec;
    case NodeProvider.PACKET:
      return {
        instanceType: '',
        tags: [],
      } as PacketNodeSpec;
    case NodeProvider.GCP:
      return {
        diskSize: 0,
        diskType: '',
        machineType: '',
        preemptible: true,
        zone: '',
        tags: [],
        labels: {'': ''},
      } as GCPNodeSpec;
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
