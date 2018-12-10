import {NodeProvider} from '../model/NodeProviderConstants';
import {AWSDatacenterSpec} from './datacenter/AWSDatacenterSpec';
import {AzureDatacenterSpec} from './datacenter/AzureDatacenterSpec';
import {BringYourOwnDatacenterSpec} from './datacenter/BringYourOwnDatacenterSpec';
import {DigitaloceanDatacenterSpec} from './datacenter/DigitaloceanDatacenterSpec';
import {HetznerDatacenterSpec} from './datacenter/HetznerDatacenterSpec';
import {OpenShiftDatacenterSpec, OpenStackDatacenterSpec} from './datacenter/OpenStackDatacenterSpec';
import {VSphereDatacenterSpec} from './datacenter/VSphereDatacenterSpec';
import {MetadataEntity} from './MetadataEntity';

export class DataCenterEntity {
  metadata: MetadataEntity;
  spec: DatacenterSpec;
  seed: boolean;
}

export class DatacenterSpec {
  seed: string;
  country: string;
  location: string;
  provider: string;

  digitalocean?: DigitaloceanDatacenterSpec;
  bringyourown?: BringYourOwnDatacenterSpec;
  aws?: AWSDatacenterSpec;
  openstack?: OpenStackDatacenterSpec;
  vsphere?: VSphereDatacenterSpec;
  hetzner?: HetznerDatacenterSpec;
  azure?: AzureDatacenterSpec;
  openshift?: OpenShiftDatacenterSpec;
}

export class DatacenterOperatingSystemOptions {
  coreos: string;
  centos: string;
  ubuntu: string;
}

export function getDatacenterProvider(datacenter: DataCenterEntity): string {
  if (!!datacenter.spec.digitalocean) {
    return NodeProvider.DIGITALOCEAN;
  }
  if (!!datacenter.spec.aws) {
    return NodeProvider.AWS;
  }
  if (!!datacenter.spec.bringyourown) {
    return NodeProvider.BRINGYOUROWN;
  }
  if (!!datacenter.spec.openstack) {
    return NodeProvider.OPENSTACK;
  }
  if (!!datacenter.spec.vsphere) {
    return NodeProvider.VSPHERE;
  }
  if (!!datacenter.spec.hetzner) {
    return NodeProvider.HETZNER;
  }
  if (!!datacenter.spec.azure) {
    return NodeProvider.AZURE;
  }
  if (!!datacenter.spec.openshift) {
    return NodeProvider.OPENSHIFT;
  }
  return '';
}
