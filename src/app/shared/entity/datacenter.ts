import {NodeProvider} from '../model/NodeProviderConstants';
import {Metadata} from './common';

export class CreateDatacenterModel {
  name: string;
  spec: DatacenterSpec;
}

export class Datacenter {
  metadata: Metadata;
  spec: DatacenterSpec;
  seed?: boolean;
}

export class DatacenterSpec {
  seed: string;
  country: string;
  location: string;
  provider: string;
  requiredEmailDomains?: string[];
  enforceAuditLogging: boolean;
  enforcePodSecurityPolicy: boolean;
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
  alibaba?: AlibabaDatacenterSpec;
}

export class DatacenterOperatingSystemOptions {
  coreos: string;
  centos: string;
  ubuntu: string;
  sles?: string;
  rhel?: string;
  flatcar?: string;
}

export class AlibabaDatacenterSpec {
  region: string;
}

export class AWSDatacenterSpec {
  region: string;
}

export class AzureDatacenterSpec {
  location: string;
}

export class BringYourOwnDatacenterSpec {}

export class DigitaloceanDatacenterSpec {
  region: string;
}

export class GCPDatacenterSpec {
  region: string;
  regional: boolean;
  zone_suffixes: string[];
}

export class HetznerDatacenterSpec {
  datacenter: string;
  location: string;
}

export class KubeVirtDatacenterSpec {}

export class OpenStackDatacenterSpec {
  availability_zone: string;
  auth_url: string;
  region: string;
  images: DatacenterOperatingSystemOptions;
  enforce_floating_ip: boolean;
}

export class PacketDatacenterSpec {
  facilities: string[];
}

export class VSphereDatacenterSpec {
  datastore: string;
  endpoint: string;
  cluster: string;
  datacenter: string;
  templates: DatacenterOperatingSystemOptions;
}

export function getDatacenterProvider(datacenter: Datacenter): NodeProvider {
  return Object.values(NodeProvider).find(provider => provider === datacenter.spec.provider) || NodeProvider.NONE;
}
