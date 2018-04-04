import { MetadataEntity } from './MetadataEntity';
import { DigitialoceanDatacenterSpec } from './datacenter/DigitialoceanDatacenterSpec';
import { BringYourOwnDatacenterSpec } from './datacenter/BringYourOwnDatacenterSpec';
import { AWSDatacenterSpec } from './datacenter/AWSDatacenterSpec';
import { OpenStackDatacenterSpec } from './datacenter/OpenStackDatacenterSpec';
import { VSphereDatacenterSpec } from './datacenter/VSphereDatacenterSpec';
import { NodeProvider } from '../model/NodeProviderConstants';

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
  vsphere?: VSphereDatacenterSpec;
}

export function getDatacenterProvider(datacenter: DataCenterEntity): string {
  switch (true) {
    case !!datacenter.spec.digitalocean: {
      return NodeProvider.DIGITALOCEAN;
    }
    case !!datacenter.spec.aws: {
      return NodeProvider.AWS;
    }
    case !!datacenter.spec.bringyourown: {
      return NodeProvider.BRINGYOUROWN;
    }
    case !!datacenter.spec.openstack: {
      return NodeProvider.OPENSTACK;
    }
    case !!datacenter.spec.vsphere: {
      return NodeProvider.VSPHERE;
    }
  }
  return '';
}
