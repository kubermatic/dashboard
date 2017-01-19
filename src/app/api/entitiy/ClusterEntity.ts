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
  dc: string;
  digitalocean: DigitialoceanCloudSpec;
  bringyourown: BringYourOwnCloudSpec;
  aws: AWSCloudSpec;

  constructor(dc: string, digitalocean: DigitialoceanCloudSpec, bringyourown: BringYourOwnCloudSpec, aws: AWSCloudSpec) {
    this.dc = dc;
    this.digitalocean = digitalocean;
    this.bringyourown = bringyourown;
    this.aws = aws;
  }
}

export class ClusterAddress {
  url: string;
  etcdURL: string;
  token: string;
  nodePort: number;

  constructor(url: string, etcdURL: string, token: string, nodePort: number) {
    this.url = url;
    this.etcdURL = etcdURL;
    this.token = token;
    this.nodePort = nodePort;
  }
}

export class ClusterStatus {
  lastTransitionTime: string;
  apiserverSSH: string;
  health: ClusterHealth;

  rootCA: KeyCert;
  phase: ClusterPhase;

  constructor(lastTransitionTime: string, apiserverSSH: string, health: ClusterHealth, rootCA: KeyCert, phase: ClusterPhase) {
    this.lastTransitionTime = lastTransitionTime;
    this.apiserverSSH = apiserverSSH;
    this.health = health;
    this.rootCA = rootCA;
    this.phase = phase;
  }
}

export class ClusterHealth {
  lastTransitionTime: string;
  apiserver: boolean;
  scheduler: boolean;
  controller: boolean;
  etcd: boolean[];
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
