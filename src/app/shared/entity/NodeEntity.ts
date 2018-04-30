import { MetadataEntityV2 } from './MetadataEntity';
import { DigitaloceanNodeSpec } from './node/DigitialoceanNodeSpec';
import { AWSNodeSpec } from './node/AWSNodeSpec';
import { OpenstackNodeSpec } from './node/OpenstackNodeSpec';
import { HetznerNodeSpec } from './node/HetznerNodeSpec';
import { VSphereNodeSpec } from './node/VSphereNodeSpec';

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
