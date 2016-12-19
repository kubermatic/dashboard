import {MetadataEntity} from './MetadataEntity';
import {DigitaloceanNodeSpec} from './node/DigitialoceanNodeSpec';
import {BringYourOwnNodeSpec} from './node/BringYourOwnNodeSpec';
import {AWSNodeSpec} from './node/AWSNodeSpec';

export class NodeEntity {
  metadata: MetadataEntity;
  spec: NodeSpec;
  status: NodeStatus;
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

  constructor(hostname: string, addresses: {[p: string]: string}) {
    this.hostname = hostname;
    this.addresses = addresses;
  }
}
