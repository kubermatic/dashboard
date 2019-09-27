import {NodeProvider} from '../model/NodeProviderConstants';

import {AWSDatacenterSpec} from './datacenter/AWSDatacenterSpec';
import {AzureDatacenterSpec} from './datacenter/AzureDatacenterSpec';
import {BringYourOwnDatacenterSpec} from './datacenter/BringYourOwnDatacenterSpec';
import {DigitaloceanDatacenterSpec} from './datacenter/DigitaloceanDatacenterSpec';
import {GCPDatacenterSpec} from './datacenter/GCPDatacenterSpec';
import {HetznerDatacenterSpec} from './datacenter/HetznerDatacenterSpec';
import {KubeVirtDatacenterSpec} from './datacenter/KubeVirtDatacenterSpec';
import {OpenStackDatacenterSpec} from './datacenter/OpenStackDatacenterSpec';
import {PacketDatacenterSpec} from './datacenter/PacketDatacenterSpec';
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
  packet?: PacketDatacenterSpec;
  vsphere?: VSphereDatacenterSpec;
  hetzner?: HetznerDatacenterSpec;
  azure?: AzureDatacenterSpec;
  gcp?: GCPDatacenterSpec;
  kubevirt?: KubeVirtDatacenterSpec;
}

export class DatacenterOperatingSystemOptions {
  coreos: string;
  centos: string;
  ubuntu: string;
}

export function getDatacenterProvider(datacenter: DataCenterEntity): NodeProvider {
  return Object.values(NodeProvider).find(provider => provider === datacenter.spec.provider) || NodeProvider.NONE;
}
