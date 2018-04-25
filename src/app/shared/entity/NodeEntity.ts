import { MetadataEntityV2 } from './MetadataEntity';
import { DigitaloceanNodeSpec } from './node/DigitialoceanNodeSpec';
import { AWSNodeSpec } from './node/AWSNodeSpec';
import { OpenstackNodeSpec } from './node/OpenstackNodeSpec';
import { HetznerNodeSpec } from './node/HetznerNodeSpec';
import { VSphereNodeSpec } from './node/VSphereNodeSpec';
import {NodeProvider} from '../model/NodeProviderConstants';

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
  kubelet: string;
  containerRuntime: NodeContainerRuntimeInfo;
}

export class NodeContainerRuntimeInfo {
  name: string;
  version: string;
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
        instanceType: '',
        diskSize: 25,
        volumeType: '',
        ami: '',
        tags: ''
      };
      return awsSpec;
    case NodeProvider.DIGITALOCEAN:
      const doSpec: DigitaloceanNodeSpec = {
        size: '',
        backups: false,
        ipv6: false,
        monitoring: false,
        tags: []
      };
      return doSpec;
    case NodeProvider.OPENSTACK:
      const osSpec: OpenstackNodeSpec = {
        flavor: '',
        image: ''
      };
      return osSpec;
    case NodeProvider.VSPHERE:
      const vsSpec: VSphereNodeSpec = {
        cpus: 1,
        memory: 20,
        template: ''
      };
      return vsSpec;
    case NodeProvider.HETZNER:
      const hSpec: HetznerNodeSpec = {
        type: ''
      };
      return hSpec;
  }
  return {};
}
