import { MetadataEntity } from './MetadataEntity';
import { DigitaloceanDatacenterSpec } from './datacenter/DigitialoceanDatacenterSpec';
import { BringYourOwnDatacenterSpec } from './datacenter/BringYourOwnDatacenterSpec';
import { AWSDatacenterSpec } from './datacenter/AWSDatacenterSpec';
import { OpenStackDatacenterSpec } from './datacenter/OpenStackDatacenterSpec';

export class DataCenterEntity {
  metadata: MetadataEntity;
  spec: DatacenterSpec;
  seed: boolean;

  constructor(metadata: MetadataEntity, spec: DatacenterSpec, seed: boolean) {
    this.metadata = metadata;
    this.spec = spec;
    this.seed = seed;
  }

  public static sortByName(a: DataCenterEntity, b: DataCenterEntity): number {
    const nameA = a.metadata.name.toLowerCase;
    const nameB = b.metadata.name.toLowerCase;

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    // names must be equal
    return 0;
  }
}

export class DatacenterSpec {
  seed: string;
  country: string;
  location: string;
  provider: string;

  digitalocean: DigitaloceanDatacenterSpec;
  bringyourown: BringYourOwnDatacenterSpec;
  aws: AWSDatacenterSpec;
  openstack: OpenStackDatacenterSpec;

  constructor(country: string,
              location: string,
              provider: string,
              digitalocean: DigitaloceanDatacenterSpec,
              bringyourown: BringYourOwnDatacenterSpec,
              aws: AWSDatacenterSpec,
              openstack: OpenStackDatacenterSpec) {
    this.country = country;
    this.location = location;
    this.provider = provider;
    this.digitalocean = digitalocean;
    this.bringyourown = bringyourown;
    this.aws = aws;
    this.openstack = openstack;
  }
}
