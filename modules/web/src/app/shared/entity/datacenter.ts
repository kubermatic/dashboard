// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {SeedOverviewDatasource} from '@app/settings/admin/seed-configurations/types/seed-configurations';
import {AuditLoggingWebhookBackend} from '@shared/entity/cluster';
import {StatusIcon} from '@shared/utils/health-status';
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
  requiredEmails?: string[];
  enforceAuditLogging: boolean;
  enforcedAuditWebhookSettings?: AuditLoggingWebhookBackend;
  enforcePodSecurityPolicy: boolean;
  kubelb?: KubeLB;
  ipv6Enabled?: boolean;
  digitalocean?: DigitaloceanDatacenterSpec;
  bringyourown?: BringYourOwnDatacenterSpec;
  aws?: AWSDatacenterSpec;
  openstack?: OpenStackDatacenterSpec;
  packet?: EquinixDatacenterSpec;
  vsphere?: VSphereDatacenterSpec;
  hetzner?: HetznerDatacenterSpec;
  azure?: AzureDatacenterSpec;
  gcp?: GCPDatacenterSpec;
  kubevirt?: KubeVirtDatacenterSpec;
  nutanix?: NutanixDatacenterSpec;
  alibaba?: AlibabaDatacenterSpec;
  anexia?: AnexiaDatacenterSpec;
  vmwareclouddirector?: VMwareCloudDirectorDatacenterSpec;
  edge?: EdgeDatacenterSpec;
  baremetal?: BaremetalDatacenterSpec;
  operatingSystemProfiles?: DatacenterOperatingSystemOptions;
  machineFlavorFilter?: MachineFlavorFilter;
  disableCsiDriver?: boolean;
}

export class MachineFlavorFilter {
  minCPU: number;
  maxCPU: number;
  minRAM: number;
  maxRAM: number;
  enableGPU: boolean;
}

export class KubeLB {
  enabled?: boolean;
  enforced?: boolean;
  useLoadBalancerClass?: boolean;
  enableGatewayAPI?: boolean;
  enableSecretSynchronizer?: boolean;
  disableIngressClass?: boolean;
}

export class DatacenterOperatingSystemOptions {
  amzn2?: string;
  flatcar?: string;
  rhel?: string;
  rockylinux?: string;
  ubuntu: string;
}

export class AnexiaDatacenterSpec {
  locationID: string;
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
  zoneSuffixes: string[];
}

export class HetznerDatacenterSpec {
  datacenter: string;
  location: string;
  network: string;
}

export class KubeVirtDatacenterSpec {}

export class NutanixDatacenterSpec {
  endpoint: string;
  port?: number;
  allow_insecure: number;
  images: DatacenterOperatingSystemOptions;
}

export class OpenStackDatacenterSpec {
  availabilityZone: string;
  authURL: string;
  region: string;
  images: DatacenterOperatingSystemOptions;
  enforceFloatingIP: boolean;
  enableConfigDrive?: boolean;
}

export class EquinixDatacenterSpec {
  facilities: string[];
}

export class VSphereDatacenterSpec {
  datastore: string;
  endpoint: string;
  cluster: string;
  datacenter: string;
  templates: DatacenterOperatingSystemOptions;
}

export class VMwareCloudDirectorDatacenterSpec {
  url: string;
  allowInsecure?: boolean;
  catalog?: string;
  storageProfile?: string;
  templates: DatacenterOperatingSystemOptions;
}

export class EdgeDatacenterSpec {}

export class BaremetalDatacenterSpec {}

export class SeedSettings {
  mla: MLA;
  metering: MeteringConfiguration;
  seedDNSOverwrite?: string;
}

export class MeteringConfiguration {
  enabled: boolean;
  // StorageClassName is the name of the storage class that the metering tool uses to save processed files before
  // exporting it to s3 bucket. Default value is kubermatic-fast.
  storageClassName: string;
  // StorageSize is the size of the storage class. Default value is 100Gi.
  storageSize: string;
}

export class MeteringReportConfiguration {
  name: string;
  // Schedule in Cron format, see https://en.wikipedia.org/wiki/Cron. Please take a note that Schedule is responsible
  // only for setting the time when a report generation mechanism kicks off. The Interval MUST be set independently.
  schedule: string;
  // Interval defines the number of days consulted in the metering report.
  interval: number;
  // Retention defines the number of days after which reports are queued for removal. The default value of "0" does not
  // create any lifecycle rule which results in keeping reports forever. Please note that this functionality works only
  // for object storage that supports an object lifecycle management mechanism.
  retention?: number;
  // Types of reports to generate. By default, all types of reports are generated.
  types?: MeteringReportType[];
}

export enum MeteringReportType {
  Cluster = 'cluster',
  Namespace = 'namespace',
}

export class MLA {
  user_cluster_mla_enabled: boolean;
}

export class AdminSeed {
  name: string;
  spec: AdminSeedSpec;
}

export enum SeedHealthyPhase {
  Healthy = 'Healthy',
  Unhealthy = 'Unhealthy',
  Invalid = 'Invalid',
  Terminating = 'Terminating',
  Running = 'Paused',
}

export class AdminSeedSpec {
  country?: string;
  location?: string;
  kubeconfig?: object;
  datacenters?: Datacenter;
  seed_dns_overwrite?: string;
  proxy_settings?: object;
  expose_strategy?: string;
  mla: MLA;
  etcdBackupRestore?: EtcdBackupRestore;
}

export class SeedOverview {
  name: string;
  location: string;
  phase: string;
  created: Date;
  providers: DatacentersByProvider[];

  static getStatusIcon(overview: SeedOverview | SeedOverviewDatasource): string {
    switch (overview.phase) {
      case SeedHealthyPhase.Healthy:
        return StatusIcon.Running;
      case SeedHealthyPhase.Unhealthy:
        return StatusIcon.Warning;
      case SeedHealthyPhase.Terminating:
        return StatusIcon.Error;
      case SeedHealthyPhase.Invalid:
        return StatusIcon.Unknown;
      default:
        return StatusIcon.Unknown;
    }
  }
}

export class DatacentersByProvider {
  [key: string]: ClustersByDatacenter;
}

export class ClustersByDatacenter {
  [key: string]: number;
}

export class MeteringCredentials {
  bucketName: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
}

export class EtcdBackupRestore {
  destinations: Destinations;
  defaultDestination: string;
}

export class Destinations {
  [key: string]: DestinationDetails;
}

export class DestinationDetails {
  bucketName: string;
  endpoint: string;
  credentials?: BackupCredentials;
}

export class BackupCredentials {
  name: string;
  namespace: string;
}

export class BackupDestination {
  destinationName: string;
  bucketName: string;
  endpoint: string;
  credentials?: BackupCredentials;
}

export function getDatacenterProvider(datacenter: Datacenter): NodeProvider {
  return Object.values(NodeProvider).find(provider => provider === datacenter.spec.provider) || NodeProvider.NONE;
}
