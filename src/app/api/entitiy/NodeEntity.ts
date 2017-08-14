import {MetadataEntity} from "./MetadataEntity";
import {DigitaloceanNodeSpec} from "./node/DigitialoceanNodeSpec";
import {AWSNodeSpec} from "./node/AWSNodeSpec";
import {OpenstackNodeSpec} from "./node/OpenstackNodeSpec";
import {BareMetalNodeSpec} from "./node/BareMetalNodeSpec";


export class NodeCreateSpec {
  digitalocean: DigitaloceanNodeSpec;
  aws: AWSNodeSpec;
  openstack: OpenstackNodeSpec;
  baremetal: BareMetalNodeSpec;

  constructor(digitalocean: DigitaloceanNodeSpec, aws: AWSNodeSpec, openstack: OpenstackNodeSpec, baremetal: BareMetalNodeSpec) {
    this.digitalocean = digitalocean;
    this.aws = aws;
    this.openstack = openstack;
    this.baremetal = baremetal;
  }
}

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
}

