import { MetadataEntity } from './MetadataEntity';
import { DigitialoceanDatacenterSpec } from './datacenter/DigitialoceanDatacenterSpec';
import { BringYourOwnDatacenterSpec } from './datacenter/BringYourOwnDatacenterSpec';
import { AWSDatacenterSpec } from './datacenter/AWSDatacenterSpec';
import { OpenStackDatacenterSpec } from './datacenter/OpenStackDatacenterSpec';
import { VSphereDatacenterSpec } from './datacenter/VSphereDatacenterSpec';

export class DataCenterEntity {
  metadata: MetadataEntity;
  spec: DatacenterSpec;
  seed: boolean;

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

  digitalocean?: DigitialoceanDatacenterSpec;
  bringyourown?: BringYourOwnDatacenterSpec;
  aws?: AWSDatacenterSpec;
  openstack?: OpenStackDatacenterSpec;
  sphere?: VSphereDatacenterSpec;
}
