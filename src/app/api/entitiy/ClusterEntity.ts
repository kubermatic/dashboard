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
  seed: string;

  constructor(metadata: MetadataEntity,
              spec: ClusterSpec,
              address: Address,
              status: Status,
              seed: string) {
    this.metadata = metadata;
    this.spec = spec;
    this.address = address;
    this.status = status;
    this.seed = seed;
  }

  isRunning(): boolean {
    return this.status.phase == "Running";
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

  constructor(cloud: CloudSpec,
              humanReadableName: string,
              masterVersion: string,) {
    this.cloud = cloud;
    this.humanReadableName = humanReadableName;
    this.masterVersion = masterVersion;
  }
}

export class Address {
  url: string;
  external_name: string;
  external_port: number;
  kubelet_token: string;
  admin_token: string;
}

export class RootCA {
  cert: string;
}

export class ApiserverSshKey {
  public_key: string;
}

export class Health {
  apiserver: boolean;
  scheduler: boolean;
  controller: boolean;
  node_controller: boolean;
  etcd: boolean;
  lastTransitionTime: string;
}

export class Status {
  lastTransitionTime: Date;
  phase: string;
  health: Health;
  lastDeployedMasterVersion: string;
  masterUpdatePhase: string;
  rootCA: RootCA;
  apiserver_ssh_key: ApiserverSshKey;
}

