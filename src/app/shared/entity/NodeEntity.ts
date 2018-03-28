import { MetadataEntity, MetadataEntityV2 } from './MetadataEntity';
import { DigitaloceanNodeSpecV2 } from './node/DigitialoceanNodeSpec';
import { AWSNodeSpecV2 } from './node/AWSNodeSpec';
import { OpenstackNodeSpec } from './node/OpenstackNodeSpec';
import { HetznerNodeSpec } from './node/HetznerNodeSpec';


export class NodeCreateSpec {
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
  aws: AWSNodeSpecV2;
  openstack: OpenstackNodeSpec;
  hetzner: HetznerNodeSpec;

  constructor(digitalocean: DigitaloceanNodeSpecV2, aws: AWSNodeSpecV2, openstack: OpenstackNodeSpec, hetzner: HetznerNodeSpec) {
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
  machineName: string;
  capacity: NodeResources;
  allocatable: NodeResources;
  addresses: NodeAddress[];
  nodeInfo: NodeSystemInfo;
  errorReason: string;
  errorMessage: string;
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

export class NodeEntityV2 {
  metadata: MetadataEntityV2;
  spec: NodeCreateSpec;
  status: NodeStatus;
}

// Following are from api/v1
// TODO: cleanup
export class Spec {
  podCIDR: string;
  externalID: string;
}

export class Capacity {
  cpu: string;
  memory: string;
  pods: string;
}

export class Allocatable {
  cpu: string;
  memory: string;
  pods: string;
}

export class Condition {
  type: string;
  status: string;
  lastHeartbeatTime: Date;
  lastTransitionTime: Date;
  reason: string;
  message: string;
}

export class Address {
  type: string;
  address: string;
}

export class KubeletEndpoint {
  Port: number;
}

export class DaemonEndpoints {
  kubeletEndpoint: KubeletEndpoint;
}

export class NodeInfo {
  machineID: string;
  systemUUID: string;
  bootID: string;
  kernelVersion: string;
  osImage: string;
  containerRuntimeVersion: string;
  kubeletVersion: string;
  kubeProxyVersion: string;
  operatingSystem: string;
  architecture: string;
}

export class Image {
  names: string[];
  sizeBytes: number;
}

export class Status {
  capacity: Capacity;
  allocatable: Allocatable;
  conditions: Condition[];
  addresses: Address[];
  daemonEndpoints: DaemonEndpoints;
  nodeInfo: NodeInfo;
  images: Image[];
}

export class NodeEntity {
  metadata: MetadataEntity;
  spec: Spec;
  status: Status;
  groupname: string;
}
