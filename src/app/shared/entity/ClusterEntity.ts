import {DigitaloceanCloudSpec} from "./cloud/DigitialoceanCloudSpec";
import {BringYourOwnCloudSpec} from "./cloud/BringYourOwnCloudSpec";
import {AWSCloudSpec} from "./cloud/AWSCloudSpec";
import {MetadataEntity} from "./MetadataEntity";
import {OpenstackCloudSpec} from "./cloud/OpenstackCloudSpec";
import {BareMetalCloudSpec} from "./cloud/BareMetalCloudSpec";
import {NodeProvider} from "../model/NodeProviderConstants";

export class ClusterEntity {
  metadata: MetadataEntity;
  spec: ClusterSpec;
  address: Address;
  status: Status;

  constructor(metadata: MetadataEntity,
              spec: ClusterSpec,
              address: Address,
              status: Status) {
    this.metadata = metadata;
    this.spec = spec;
    this.address = address;
    this.status = status;
  }

  isRunning(): boolean {
    return this.status.phase == "Running";
  }

  isFailed(): boolean {
    return this.status.phase == 'Failed';
  }

  get provider(): string {
    switch (true) {
      case !!this.spec.cloud.digitalocean: {
        return NodeProvider.DIGITALOCEAN;
      }
      case !!this.spec.cloud.aws: {
        return NodeProvider.AWS;
      }
      case !!this.spec.cloud.bringyourown: {
        return NodeProvider.BRINGYOUROWN;
      }
      case !!this.spec.cloud.openstack: {
        return NodeProvider.OPENSTACK;
      }
      case !!this.spec.cloud.baremetal: {
        return NodeProvider.BAREMETAL;
      }
    }
    return ""
  }
}

export class CloudSpec {
  dc: string;
  digitalocean: DigitaloceanCloudSpec;
  aws: AWSCloudSpec;
  bringyourown: BringYourOwnCloudSpec;
  openstack: OpenstackCloudSpec;
  baremetal: BareMetalCloudSpec;

  constructor(dc: string,
              digitalocean: DigitaloceanCloudSpec,
              aws: AWSCloudSpec,
              bringyourown: BringYourOwnCloudSpec,
              openstack: OpenstackCloudSpec,
              baremetal: BareMetalCloudSpec,
  ) {
    this.dc = dc;
    this.digitalocean = digitalocean;
    this.bringyourown = bringyourown;
    this.aws = aws;
    this.openstack = openstack;
    this.baremetal = baremetal;
  }
}

export class ClusterSpec {
  cloud: CloudSpec;
  humanReadableName: string;
  masterVersion: string;
  seedDatacenterName: string;

  constructor(cloud: CloudSpec,
              humanReadableName: string,
              masterVersion: string,
              seedDatacenterName: string) {
    this.cloud = cloud;
    this.humanReadableName = humanReadableName;
    this.masterVersion = masterVersion;
    this.seedDatacenterName = seedDatacenterName;
  }
}

export class Address {
  url: string;
  externalName: string;
  externalPort: number;
  kubeletToken: string;
  adminToken: string;
}

export class Certificate {
  key: string;
  cert: string;
}

export class Health {
  apiserver: boolean;
  scheduler: boolean;
  controller: boolean;
  nodeController: boolean;
  etcd: boolean;
  lastTransitionTime: string;
}

export class Status {
  lastTransitionTime: Date;
  phase: string;
  lastDeployedMasterVersion: string;
  masterUpdatePhase: string;
  rootCA: Certificate;
  apiserverCert: Certificate;
  kubeletCert: Certificate;
  apiserverSshKey: SSHKeyPair;
  serviceAccountKey: string;
  seed: string;
  namespaceName: string;
}

export class SSHKeyPair {
  privateKey: string;
  publicKey: string;
}

