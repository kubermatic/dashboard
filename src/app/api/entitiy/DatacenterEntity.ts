import {MetadataEntity} from "./MetadataEntity";
import {DigitialoceanDatacenterSpec} from "./datacenter/DigitialoceanDatacenterSpec";
import {BringYourOwnDatacenterSpec} from "./datacenter/BringYourOwnDatacenterSpec";
import {AWSDatacenterSpec} from "./datacenter/AWSDatacenterSpec";

export class DataCenterEntity {
  metadata: MetadataEntity;
  spec: DatacenterSpec;
  seed: boolean;

  constructor(metadata: MetadataEntity, spec: DatacenterSpec, seed: boolean) {
    this.metadata = metadata;
    this.spec = spec;
    this.seed = seed;
  }
}

export class DatacenterSpec {
  country: string;
  location: string;
  provider: string;

  digitalocean: DigitialoceanDatacenterSpec;
  bringyourown: BringYourOwnDatacenterSpec;
  aws: AWSDatacenterSpec;

  constructor(country: string, location: string, provider: string,
              digitalocean: DigitialoceanDatacenterSpec, bringyourown: BringYourOwnDatacenterSpec,
              aws: AWSDatacenterSpec) {
    this.country = country;
    this.location = location;
    this.provider = provider;
    this.digitalocean = digitalocean;
    this.bringyourown = bringyourown;
    this.aws = aws;
  }
}
