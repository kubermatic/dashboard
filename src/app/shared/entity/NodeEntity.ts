import { MetadataEntityV2 } from './MetadataEntity';
import { DigitaloceanNodeSpecV2 } from './node/DigitialoceanNodeSpec';
import { AWSNodeSpec } from './node/AWSNodeSpec';
import { OpenstackNodeSpec } from './node/OpenstackNodeSpec';
import { HetznerNodeSpec } from './node/HetznerNodeSpec';

export class NodeEntity {
  metadata: MetadataEntityV2;
  spec: NodeSpec;
  status?: NodeStatus;
}

export class NodeSpec {
  cloud: NodeCloudSpec;
  operatingSystem: OperatingSystemSpec;
  versions: NodeVersionInfo;

  constructor(cloud: NodeCloudSpec, operatingSystem: OperatingSystemSpec, versions: NodeVersionInfo) {
    this.cloud = cloud;
    this.operatingSystem = operatingSystem;
    this.versions = versions;
  }
}

export class NodeCloudSpec {
  digitalocean: DigitaloceanNodeSpecV2;
  aws: AWSNodeSpec;
  openstack: OpenstackNodeSpec;
  hetzner: HetznerNodeSpec;

  constructor(digitalocean: DigitaloceanNodeSpecV2, aws: AWSNodeSpec, openstack: OpenstackNodeSpec, hetzner: HetznerNodeSpec) {
    this.digitalocean = digitalocean;
    this.aws = aws;
    this.openstack = openstack;
    this.hetzner = hetzner;
  }
}

export class OperatingSystemSpec {
  ubuntu: UbuntuSpec;
  containerLinux: ContainerLinuxSpec;

  constructor(ubuntu: UbuntuSpec, containerLinux: ContainerLinuxSpec) {
    this.ubuntu = ubuntu;
    this.containerLinux = containerLinux;
  }
}

export class UbuntuSpec {
  distUpgradeOnBoot: boolean;

  constructor(distUpgradeOnBoot: boolean) {
    this.distUpgradeOnBoot = distUpgradeOnBoot;
  }
}

export class ContainerLinuxSpec {
  disableAutoUpdate: boolean;

  constructor(disableAutoUpdate: boolean) {
    this.disableAutoUpdate = disableAutoUpdate;
  }
}

export class NodeVersionInfo {
  kubelet: string;
  containerRuntime: NodeContainerRuntimeInfo;

  constructor(kubelet: string, containerRuntime: NodeContainerRuntimeInfo) {
    this.kubelet = kubelet;
    this.containerRuntime = containerRuntime;
  }
}

export class NodeContainerRuntimeInfo {
  name: string;
  version: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }
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
