import { MetadataEntityV2 } from './MetadataEntity';
import { DigitaloceanNodeSpec } from './node/DigitaloceanNodeSpec';
import { AWSNodeSpec } from './node/AWSNodeSpec';
import { OpenstackNodeSpec } from './node/OpenstackNodeSpec';
import { HetznerNodeSpec } from './node/HetznerNodeSpec';
import { VSphereNodeSpec } from './node/VSphereNodeSpec';
import { NodeProvider } from '../model/NodeProviderConstants';

export class NodeEntity {
  metadata: MetadataEntityV2;
  spec: NodeSpec;
  status?: NodeStatus;
}

export class NodeSpec {
  cloud: NodeCloudSpec;
  operatingSystem: OperatingSystemSpec;
  versions?: NodeVersionInfo;
}

export class NodeCloudSpec {
  digitalocean?: DigitaloceanNodeSpec;
  aws?: AWSNodeSpec;
  openstack?: OpenstackNodeSpec;
  hetzner?: HetznerNodeSpec;
  vsphere?: VSphereNodeSpec;
}

export class OperatingSystemSpec {
  ubuntu?: UbuntuSpec;
  containerLinux?: ContainerLinuxSpec;
}

export class UbuntuSpec {
  distUpgradeOnBoot: boolean;
}

export class ContainerLinuxSpec {
  disableAutoUpdate: boolean;
}

export class NodeVersionInfo {
  kubelet?: string;
  containerRuntime?: NodeContainerRuntimeInfo;
}

export class NodeContainerRuntimeInfo {
  name?: string;
  version?: string;
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
  containerRuntime: string;
  containerRuntimeVersion: string;
  kubeletVersion: string;
  operatingSystem: string;
  architecture: string;
}


export function getEmptyNodeProviderSpec(provider: string): object {
  switch (provider) {
    case NodeProvider.AWS:
      const awsSpec: AWSNodeSpec = {
        instanceType: 't2.small',
        diskSize: 25,
        volumeType: 'standard',
        ami: '',
        tags: {'': ''}
      };
      return awsSpec;
    case NodeProvider.DIGITALOCEAN:
      const doSpec: DigitaloceanNodeSpec = {
        size: 's-1vcpu-1gb',
        backups: false,
        ipv6: false,
        monitoring: false,
        tags: []
      };
      return doSpec;
    case NodeProvider.OPENSTACK:
      const osSpec: OpenstackNodeSpec = {
        flavor: 'm1.small',
        image: ''
      };
      return osSpec;
    case NodeProvider.VSPHERE:
      const vsSpec: VSphereNodeSpec = {
        cpus: 1,
        memory: 512,
        template: 'ubuntu-template'
      };
      return vsSpec;
    case NodeProvider.HETZNER:
      const hSpec: HetznerNodeSpec = {
        type: 'cx31'
      };
      return hSpec;
  }
  return {};
}

export function getEmptyOperatingSystemSpec(): object {
  const osSpec: OperatingSystemSpec = {
    ubuntu: {
      distUpgradeOnBoot: false
    }
  };
  return osSpec;
}

export function getEmptyNodeVersionSpec(): object {
  const versionSpec: NodeVersionInfo = {
    containerRuntime: {
      name: 'docker'
    }
  };
  return versionSpec;
}
