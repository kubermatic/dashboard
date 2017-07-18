import {MetadataEntity} from "./MetadataEntity";
import {DigitaloceanNodeSpec} from "./node/DigitialoceanNodeSpec";
import {BringYourOwnNodeSpec} from "./node/BringYourOwnNodeSpec";
import {AWSNodeSpec} from "./node/AWSNodeSpec";

export class NodeEntity {
  metadata: MetadataEntity;
  spec: NodeSpec;
  status: NodeStatus;

  constructor(metadata: MetadataEntity, spec: NodeSpec, status: NodeStatus) {
    this.metadata = metadata;
    this.spec = spec;
    this.status = status;
  }
}

export class NodeSpec {
  dc: string;
  digitalocean: DigitaloceanNodeSpec;
  bringyourown: BringYourOwnNodeSpec;
  aws: AWSNodeSpec;

  constructor(dc: string, digitalocean: DigitaloceanNodeSpec, bringyourown: BringYourOwnNodeSpec, aws: AWSNodeSpec) {
    this.dc = dc;
    this.digitalocean = digitalocean;
    this.bringyourown = bringyourown;
    this.aws = aws;
  }
}

export class NodeStatus {
  hostname: string;
  addresses: {[key: string]: string};
  condition: any;
  versions: any;
  cpu: any;
  memory: any;

  constructor(hostname: string, addresses: {[p: string]: string}, condition: any, versions: any, cpu: any, memory: any) {
    this.hostname = hostname;
    this.addresses = addresses;
    this.condition = condition;
    this.versions = versions;
    this.cpu = cpu;
    this.memory = memory;
  }
}
