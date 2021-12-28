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

import {NodeProvider} from '../model/NodeProviderConstants';
import {MachineDeployment} from '@shared/entity/machine-deployment';

export enum Provider {
  Alibaba = 'alibaba',
  Anexia = 'anexia',
  AWS = 'aws',
  Azure = 'azure',
  kubeAdm = 'bringyourown',
  Digitalocean = 'digitalocean',
  GCP = 'gcp',
  Hetzner = 'hetzner',
  KubeVirt = 'kubevirt',
  OpenStack = 'openstack',
  Equinix = 'packet',
  VSphere = 'vsphere',
}

const PROVIDER_DISPLAY_NAMES = new Map<Provider, string>([
  [Provider.Alibaba, 'Alibaba'],
  [Provider.Anexia, 'Anexia'],
  [Provider.AWS, 'AWS'],
  [Provider.Azure, 'Azure'],
  [Provider.kubeAdm, 'kubeAdm'],
  [Provider.Digitalocean, 'DigitalOcean'],
  [Provider.GCP, 'Google Cloud'],
  [Provider.Hetzner, 'Hetzner'],
  [Provider.KubeVirt, 'KubeVirt'],
  [Provider.OpenStack, 'Openstack'],
  [Provider.Equinix, 'Equinix Metal'],
  [Provider.VSphere, 'VSphere'],
]);

export function getProviderDisplayName(provider: Provider): string {
  return PROVIDER_DISPLAY_NAMES.get(provider);
}

export const enum Finalizer {
  DeleteVolumes = 'DeleteVolumes',
  DeleteLoadBalancers = 'DeleteLoadBalancers',
}

export enum ClusterType {
  Kubernetes = 'kubernetes',
}

export enum ContainerRuntime {
  Containerd = 'containerd',
  Docker = 'docker',
}

export const END_OF_DOCKER_SUPPORT_VERSION = '1.24.0';

export class Cluster {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec: ClusterSpec;
  status?: Status;
  type: ClusterType;
  labels?: object;
  inheritedLabels?: object;
  credential?: string;

  static getProvider(cluster: Cluster): Provider {
    return Object.values(Provider)
      .filter(provider => cluster.spec.cloud[provider])
      .pop();
  }

  static getProviderDisplayName(cluster: Cluster): string {
    return getProviderDisplayName(Cluster.getProvider(cluster));
  }

  static newEmptyClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {} as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}

export class CloudSpec {
  dc: string;
  digitalocean?: DigitaloceanCloudSpec;
  aws?: AWSCloudSpec;
  bringyourown?: BringYourOwnCloudSpec;
  openstack?: OpenstackCloudSpec;
  packet?: EquinixCloudSpec;
  baremetal?: BareMetalCloudSpec;
  vsphere?: VSphereCloudSpec;
  hetzner?: HetznerCloudSpec;
  azure?: AzureCloudSpec;
  fake?: FakeCloudSpec;
  gcp?: GCPCloudSpec;
  kubevirt?: KubeVirtCloudSpec;
  alibaba?: AlibabaCloudSpec;
  anexia?: AnexiaCloudSpec;
}

export class AlibabaCloudSpec {
  accessKeyID: string;
  accessKeySecret: string;
}

export class AWSCloudSpec {
  accessKeyId: string;
  secretAccessKey: string;
  assumeRoleARN: string;
  assumeRoleExternalID: string;
  vpcId: string;
  routeTableId: string;
  securityGroupID: string;
  instanceProfileName: string;
  roleARN: string;
}

export class AzureCloudSpec {
  clientID: string;
  clientSecret: string;
  resourceGroup: string;
  vnetResourceGroup: string;
  routeTable: string;
  securityGroup: string;
  subnet: string;
  subscriptionID: string;
  tenantID: string;
  vnet: string;
  loadBalancerSKU: string;
  assignAvailabilitySet: boolean;
}

export class BareMetalCloudSpec {
  name: string;
}

export class BringYourOwnCloudSpec {}

export class DigitaloceanCloudSpec {
  token: string;
}

export class AnexiaCloudSpec {
  token: string;
}

export class FakeCloudSpec {
  token: string;
}

export class GCPCloudSpec {
  network: string;
  serviceAccount: string;
  subnetwork: string;
}

export class HetznerCloudSpec {
  token: string;
  network?: string;
}

export class KubeVirtCloudSpec {
  kubeconfig: string;
}

export class OpenstackCloudSpec {
  useToken?: boolean;
  applicationCredentialID?: string;
  applicationCredentialSecret?: string;
  username: string;
  password: string;
  project: string;
  projectID: string;
  domain: string;
  network: string;
  securityGroups: string;
  floatingIpPool: string;
  subnetID: string;
}

export class EquinixCloudSpec {
  apiKey: string;
  projectID: string;
  billingCycle: string;
}

export class VSphereCloudSpec {
  username: string;
  password: string;
  vmNetName: string;
  folder?: string;
  infraManagementUser: VSphereInfraManagementUser;
  datastore?: string;
  datastoreCluster?: string;
  resourcePool?: string;
}

export class VSphereInfraManagementUser {
  username: string;
  password: string;
}

export class ClusterSpec {
  cloud: CloudSpec;
  machineNetworks?: MachineNetwork[];
  auditLogging?: AuditLoggingSettings;
  opaIntegration?: OPAIntegration;
  version?: string;
  usePodSecurityPolicyAdmissionPlugin?: boolean;
  usePodNodeSelectorAdmissionPlugin?: boolean;
  useEventRateLimitAdmissionPlugin?: boolean;
  eventRateLimitConfig?: EventRateLimitConfig;
  admissionPlugins?: string[];
  enableUserSSHKeyAgent?: boolean;
  enableOperatingSystemManager?: boolean;
  podNodeSelectorAdmissionPluginConfig?: object;
  mla?: MLASettings;
  containerRuntime?: ContainerRuntime;
  clusterNetwork?: ClusterNetwork;
  cniPlugin?: CNIPluginConfig;
}

export class EventRateLimitConfig {
  namespace: EventRateLimitConfigItem;
}

export class EventRateLimitConfigItem {
  qps: number;
  burst: number;
  cacheSize: number;
}

export class ClusterNetwork {
  pods?: NetworkRanges;
  proxyMode?: ProxyMode;
  services?: NetworkRanges;
  konnectivityEnabled?: boolean;
}

export class CNIPluginConfig {
  type: string;
  version: string;
}

export class NetworkRanges {
  cidrBlocks: string[];
  clusterNetwork?: ClusterNetwork;
}

export class CNIPluginVersions {
  cniPluginType: string;
  versions: string[];
}

export enum ProxyMode {
  ipvs = 'ipvs',
  iptables = 'iptables',
  ebpf = 'ebpf',
}

export enum CNIPlugin {
  Canal = 'canal',
  Cilium = 'cilium',
  None = 'none',
}

export enum AuditPolicyPreset {
  Custom = '',
  Metadata = 'metadata',
  Recommended = 'recommended',
  Minimal = 'minimal',
}

export class AuditLoggingSettings {
  enabled?: boolean;
  policyPreset?: AuditPolicyPreset;
}

export class OPAIntegration {
  enabled: boolean;
}

export class MachineNetwork {
  cidr: string;
  dnsServers: string[];
  gateway: string;
}

export class MLASettings {
  loggingEnabled?: boolean;
  monitoringEnabled?: boolean;
}

export class Status {
  url: string;
  version: string;
  externalCCMMigration: ExternalCCMMigrationStatus;
}

export enum ExternalCCMMigrationStatus {
  NotNeeded = 'NotNeeded',
  Supported = 'Supported',
  Unsupported = 'Unsupported',
  InProgress = 'InProgress',
}

export function getExternalCCMMigrationStatusMessage(status: ExternalCCMMigrationStatus): string {
  switch (status) {
    case ExternalCCMMigrationStatus.InProgress:
      return 'Migration procedure to the external CCM is in progress.';
    case ExternalCCMMigrationStatus.NotNeeded:
      return 'External CCM is already in use.';
    case ExternalCCMMigrationStatus.Supported:
      return 'External CCM is not used but supported. Click here to start migration.';
    case ExternalCCMMigrationStatus.Unsupported:
      return 'External CCM is not used and not supported.';
    default:
      return '';
  }
}

export class MasterVersion {
  version: string;
  default?: boolean;
  restrictedByKubeletVersion?: boolean;
}

export class Token {
  token: string;
}

export class ClusterPatch {
  id?: string;
  name?: string;
  labels?: object;
  spec?: ClusterSpecPatch;
}

export class ClusterSpecPatch {
  cloud?: CloudSpecPatch;
  version?: string;
  usePodSecurityPolicyAdmissionPlugin?: boolean;
  usePodNodeSelectorAdmissionPlugin?: boolean;
  useEventRateLimitAdmissionPlugin?: boolean;
  eventRateLimitConfig?: EventRateLimitConfig;
  admissionPlugins?: string[];
  opaIntegration?: OPAIntegration;
  clusterNetwork?: ClusterNetwork;
  podNodeSelectorAdmissionPluginConfig?: object;
  auditLogging?: AuditLoggingSettings;
  machineNetworks?: MachineNetwork[];
  mla?: MLASettings;
  containerRuntime?: ContainerRuntime;
  cniPlugin?: CNIPluginConfigPatch;
}

export class CNIPluginConfigPatch {
  version: string;
}

export class CloudSpecPatch {
  anexia?: AnexiaCloudSpecPatch;
  digitalocean?: DigitaloceanCloudSpecPatch;
  aws?: AWSCloudSpecPatch;
  openstack?: OpenstackCloudSpecPatch;
  packet?: EquinixCloudSpecPatch;
  vsphere?: VSphereCloudSpecPatch;
  hetzner?: HetznerCloudSpecPatch;
  azure?: AzureCloudSpecPatch;
  gcp?: GCPCloudSpecPatch;
  kubevirt?: KubevirtCloudSpecPatch;
  alibaba?: AlibabaCloudSpecPatch;
}

export class AnexiaCloudSpecPatch {
  token?: string;
}

export class DigitaloceanCloudSpecPatch {
  token?: string;
}

export class GCPCloudSpecPatch {
  serviceAccount?: string;
}

export class OpenstackCloudSpecPatch {
  username?: string;
  password?: string;
}

export class EquinixCloudSpecPatch {
  apiKey?: string;
  projectID?: string;
  billingCycle?: string;
}

export class HetznerCloudSpecPatch {
  token?: string;
}

export class AWSCloudSpecPatch {
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class AzureCloudSpecPatch {
  clientID?: string;
  clientSecret?: string;
  subscriptionID?: string;
  tenantID?: string;
}

export class VSphereCloudSpecPatch {
  username?: string;
  password?: string;
  infraManagementUser?: VSphereInfraManagementUserPatch;
}

export class VSphereInfraManagementUserPatch {
  username?: string;
  password?: string;
}

export class KubevirtCloudSpecPatch {
  kubeconfig?: string;
}

export class AlibabaCloudSpecPatch {
  accessKeyID?: string;
  accessKeySecret?: string;
}

export class ProviderSettingsPatch {
  cloudSpecPatch: CloudSpecPatch;
  isValid: boolean;
}

export function getEmptyCloudProviderSpec(provider: NodeProvider): object {
  switch (provider) {
    case NodeProvider.AWS:
      return {
        accessKeyId: '',
        secretAccessKey: '',
        routeTableId: '',
        vpcId: '',
        securityGroupID: '',
        instanceProfileName: '',
        roleARN: '',
      } as AWSCloudSpec;
    case NodeProvider.DIGITALOCEAN:
      return {
        token: '',
      } as DigitaloceanCloudSpec;
    case NodeProvider.BAREMETAL:
      return {
        name: '',
      } as BareMetalCloudSpec;
    case NodeProvider.OPENSTACK:
      return {
        username: '',
        password: '',
        floatingIpPool: '',
        securityGroups: '',
        network: '',
        domain: '',
        project: '',
        projectID: '',
        subnetID: '',
      } as OpenstackCloudSpec;
    case NodeProvider.BRINGYOUROWN:
      return {} as BringYourOwnCloudSpec;
    case NodeProvider.VSPHERE:
      return {
        username: '',
        password: '',
        vmNetName: '',
        folder: '',
        infraManagementUser: {
          username: '',
          password: '',
        },
      } as VSphereCloudSpec;
    case NodeProvider.HETZNER:
      return {
        token: '',
      } as HetznerCloudSpec;
    case NodeProvider.AZURE:
      return {
        clientID: '',
        clientSecret: '',
        resourceGroup: '',
        routeTable: '',
        securityGroup: '',
        subnet: '',
        subscriptionID: '',
        tenantID: '',
        vnet: '',
        loadBalancerSKU: '',
      } as AzureCloudSpec;
    case NodeProvider.EQUINIX:
      return {} as EquinixCloudSpec;
    case NodeProvider.KUBEVIRT:
      return {kubeconfig: ''} as KubeVirtCloudSpec;
    case NodeProvider.GCP:
      return {
        network: '',
        serviceAccount: '',
        subnetwork: '',
      } as GCPCloudSpec;
    case NodeProvider.ALIBABA:
      return {
        accessKeyID: '',
        accessKeySecret: '',
      } as AlibabaCloudSpec;
    case NodeProvider.ANEXIA:
      return {
        token: '',
      };
  }
  return {};
}

export const AVAILABLE_EQUINIX_BILLING_CYCLES = ['hourly', 'daily'];

export const AZURE_LOADBALANCER_SKUS = ['basic', 'standard'];

export class CreateClusterModel {
  cluster: ClusterModel;
  nodeDeployment?: MachineDeployment;
}

class ClusterModel {
  name: string;
  spec: ClusterSpec;
  labels?: object;
  type: string;
  credential?: string;
}
