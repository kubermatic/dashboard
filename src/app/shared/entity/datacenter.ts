// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NodeProvider} from '../model/NodeProviderConstants';
import {Metadata} from './common';

export class CreateDatacenterModel {
  name: string;
  spec: DatacenterSpec;
}

export class Datacenter {
  metadata: Metadata;
  spec: DatacenterSpec;
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
  anexia?: AnexiaDatacenterSpec;
}

export class DatacenterOperatingSystemOptions {
  centos: string;
  ubuntu: string;
  sles?: string;
  rhel?: string;
  flatcar?: string;
}

export class AnexiaDatacenterSpec {
  location_id: string;
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
  network: string;
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

export class SeedSettings {
  mla: MLA;
}

export class MLA {
  user_cluster_mla_enabled: boolean;
}

export class AdminSeed {
  name: string;
  spec: AdminSeedSpec;
}

export class AdminSeedSpec {
  backupRestore?: BackupRestoreConfiguration;
}

export class BackupRestoreConfiguration {
  s3BucketName?: string;
  s3Endpoint?: string;
}

export function getDatacenterProvider(datacenter: Datacenter): NodeProvider {
  return Object.values(NodeProvider).find(provider => provider === datacenter.spec.provider) || NodeProvider.NONE;
}
