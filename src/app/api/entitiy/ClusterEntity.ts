import {MetadataEntity} from "./MetadataEntity";
import {DigitialoceanCloudSpec} from "./cloud/DigitialoceanCloudSpec";
import {BringYourOwnCloudSpec} from "./cloud/BringYourOwnCloudSpec";
import {AWSCloudSpec} from "./cloud/AWSCloudSpec";
import {KeyCert} from "./KeyCert";
import {DataCenterEntity} from "./DatacenterEntity";

export class ClusterEntity {
  constructor(
    public metadata: MetadataEntity,
    public spec: ClusterSpec,
    public address: ClusterAddress,
    public status: ClusterStatus,
    public dc: DataCenterEntity
  ) {}
}

export class ClusterSpec {
  constructor(
    public cloud: CloudSpec,
    public humanReadableName: string
  ) {}
}

export class CloudSpec {
  constructor(
    public dc: string,
    public digitalocean: DigitialoceanCloudSpec,
    public bringyourown: BringYourOwnCloudSpec,
    public aws: AWSCloudSpec) {}
}

export class ClusterAddress {
  constructor(
    public url: string,
    public etcdURL: string,
    public token: string,
    public nodePort: number
  ) {}
}

export class ClusterStatus {
  constructor(
    public lastTransitionTime: string,
    public apiserverSSH: string,
    public health: ClusterHealth,
    public rootCA: KeyCert,
    public phase: ClusterPhase
  ) {}
}

export class ClusterHealth {
  constructor(
    public lastTransitionTime: string,
    public apiserver: boolean,
    public scheduler: boolean,
    public controller: boolean,
    public etcd: boolean[]
  ) {}
}

enum ClusterPhase {
  Unknown,
  Pending,
  Launching,
  Failed,
  Running,
  Paused,
  Deleting,
}
