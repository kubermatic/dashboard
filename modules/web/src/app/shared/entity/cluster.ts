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

import {Application} from '@shared/entity/application';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import _ from 'lodash';
import {isObjectEmpty} from '@shared/utils/common';

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
  Nutanix = 'nutanix',
  OpenStack = 'openstack',
  Equinix = 'packet',
  VSphere = 'vsphere',
  VMwareCloudDirector = 'vmwareclouddirector',
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
  [Provider.Nutanix, 'Nutanix'],
  [Provider.OpenStack, 'Openstack'],
  [Provider.Equinix, 'Equinix Metal'],
  [Provider.VSphere, 'VSphere'],
  [Provider.VMwareCloudDirector, 'VMware Cloud Director'],
]);

export function getProviderDisplayName(provider: Provider): string {
  return PROVIDER_DISPLAY_NAMES.get(provider);
}

export const enum Finalizer {
  DeleteVolumes = 'DeleteVolumes',
  DeleteLoadBalancers = 'DeleteLoadBalancers',
}

export enum ContainerRuntime {
  Containerd = 'containerd',
  Docker = 'docker',
}

export const END_OF_DOCKER_SUPPORT_VERSION = '1.24.0';
export const END_OF_DYNAMIC_KUBELET_CONFIG_SUPPORT_VERSION = '1.24';
export const END_OF_POD_SECURITY_POLICY_SUPPORT_VERSION = '1.25';

export class Cluster {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec: ClusterSpec;
  status?: Status;
  labels?: Record<string, string>;
  inheritedLabels?: object;
  credential?: string;
  machineDeploymentCount?: number;
  annotations?: Record<ClusterAnnotation | string, string>;

  static isDualStackNetworkSelected(cluster: Cluster) {
    return cluster?.spec.clusterNetwork?.ipFamily === IPFamily.DualStack;
  }

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
  providerName: string;
  digitalocean?: DigitaloceanCloudSpec;
  aws?: AWSCloudSpec;
  bringyourown?: BringYourOwnCloudSpec;
  openstack?: OpenstackCloudSpec;
  packet?: EquinixCloudSpec;
  vsphere?: VSphereCloudSpec;
  hetzner?: HetznerCloudSpec;
  azure?: AzureCloudSpec;
  fake?: FakeCloudSpec;
  gcp?: GCPCloudSpec;
  kubevirt?: KubeVirtCloudSpec;
  nutanix?: NutanixCloudSpec;
  alibaba?: AlibabaCloudSpec;
  anexia?: AnexiaCloudSpec;
  vmwareclouddirector?: VMwareCloudDirectorCloudSpec;
}

export class ExtraCloudSpecOptions {
  constructor(public nodePortsAllowedIPRanges?: NetworkRanges) {}

  static new(spec: AWSCloudSpec | GCPCloudSpec | AzureCloudSpec | OpenstackCloudSpec): ExtraCloudSpecOptions {
    return new ExtraCloudSpecOptions(spec.nodePortsAllowedIPRanges);
  }
}

export class AlibabaCloudSpec {
  accessKeyID: string;
  accessKeySecret: string;
}

export class AWSCloudSpec extends ExtraCloudSpecOptions {
  accessKeyID: string;
  secretAccessKey: string;
  assumeRoleARN: string;
  assumeRoleExternalID: string;
  vpcID: string;
  routeTableID: string;
  securityGroupID: string;
  instanceProfileName: string;
  roleARN: string;

  static isEmpty(spec: AWSCloudSpec): boolean {
    return _.difference(Object.keys(spec), Object.keys(ExtraCloudSpecOptions.new(spec))).every(key => !spec[key]);
  }
}

export class AzureCloudSpec extends ExtraCloudSpecOptions {
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

  static isEmpty(spec: AzureCloudSpec): boolean {
    const optionalFields = ['assignAvailabilitySet'];
    return _.difference(Object.keys(spec), [...Object.keys(ExtraCloudSpecOptions.new(spec)), ...optionalFields]).every(
      key => !spec[key]
    );
  }
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

export class GCPCloudSpec extends ExtraCloudSpecOptions {
  network: string;
  serviceAccount: string;
  subnetwork: string;

  static isEmpty(spec: GCPCloudSpec): boolean {
    return _.difference(Object.keys(spec), Object.keys(ExtraCloudSpecOptions.new(spec))).every(key => !spec[key]);
  }
}

export class HetznerCloudSpec {
  token: string;
  network?: string;
}

export class KubeVirtCloudSpec {
  kubeconfig: string;
  preAllocatedDataVolumes: KubeVirtPreAllocatedDataVolume[];
}

export class KubeVirtPreAllocatedDataVolume {
  name: string;
  size: string;
  storageClass: string;
  url: string;
}

export class NutanixCloudSpec {
  clusterName: string;
  projectName?: string;
  proxyURL?: string;
  username?: string;
  password?: string;
  csi?: NutanixCSIConfig;

  // Following check skips storage class settings to allow using them and preset at the same time.
  // See also: NutanixProviderExtendedComponent._alwaysEnabledControls
  static isEmpty(spec: NutanixCloudSpec): boolean {
    return (
      isObjectEmpty(_.omitBy(spec, (_, key) => key === 'csi')) &&
      isObjectEmpty(_.omitBy(spec.csi, (_, key) => key === 'fstype' || key === 'storageContainer'))
    );
  }
}

export class NutanixCSIConfig {
  username: string;
  password: string;
  endpoint: string;
  port?: number;
  storageContainer?: string;
  fstype?: string;
  ssSegmentedIscsiNetwork?: boolean;
}

export class OpenstackCloudSpec extends ExtraCloudSpecOptions {
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
  floatingIPPool: string;
  subnetID: string;
  ipv6SubnetID: string;
  ipv6SubnetPool: string;
  enableIngressHostname?: boolean;
  ingressHostnameSuffix?: string;

  static isEmpty(spec: OpenstackCloudSpec): boolean {
    return _.difference(
      OpenstackCloudSpec.getKeysToCompare(spec),
      OpenstackCloudSpec.getKeysToCompare(ExtraCloudSpecOptions.new(spec))
    ).every(key => !spec[key]);
  }

  private static getKeysToCompare(spec: ExtraCloudSpecOptions): string[] {
    return Object.keys(spec).filter(key => key !== 'enableIngressHostname' && key !== 'ingressHostnameSuffix');
  }
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
  tags?: VSphereTags;
}

export class VSphereInfraManagementUser {
  username: string;
  password: string;
}

export class VSphereTags {
  tags: string[];
  categoryID: string;
}

export class VMwareCloudDirectorCloudSpec {
  username: string;
  password: string;
  apiToken: string;
  organization: string;
  vdc: string;
  ovdcNetwork: string;
  vapp?: string;
  csi: VMwareCloudDirectorCSIConfig;

  // Following check skips storage class settings to allow using them and preset at the same time.
  static isEmpty(spec: VMwareCloudDirectorCloudSpec): boolean {
    return (
      isObjectEmpty(_.omitBy(spec, (_, key) => key === 'csi')) &&
      isObjectEmpty(_.omitBy(spec.csi, (_, key) => key === 'filesystem' || key === 'storageProfile'))
    );
  }
}

export class VMwareCloudDirectorCSIConfig {
  storageProfile: string;
  filesystem: string;
}

export class ClusterSpec {
  cloud: CloudSpec;
  machineNetworks?: MachineNetwork[];
  auditLogging?: AuditLoggingSettings;
  opaIntegration?: OPAIntegration;
  kubernetesDashboard?: KubernetesDashboard;
  version?: string;
  usePodSecurityPolicyAdmissionPlugin?: boolean;
  usePodNodeSelectorAdmissionPlugin?: boolean;
  useEventRateLimitAdmissionPlugin?: boolean;
  eventRateLimitConfig?: EventRateLimitConfig;
  admissionPlugins?: string[];
  enableUserSSHKeyAgent?: boolean;
  enableOperatingSystemManager?: boolean;
  podNodeSelectorAdmissionPluginConfig?: Record<string, string>;
  mla?: MLASettings;
  containerRuntime?: ContainerRuntime;
  clusterNetwork?: ClusterNetwork;
  cniPlugin?: CNIPluginConfig;
  apiServerAllowedIPRanges?: NetworkRanges;
  exposeStrategy?: ExposeStrategy;
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
  ipFamily?: string;
  pods?: NetworkRanges;
  proxyMode?: ProxyMode;
  services?: NetworkRanges;
  nodeCidrMaskSizeIPv4?: number;
  nodeCidrMaskSizeIPv6?: number;
  nodeLocalDNSCacheEnabled?: boolean;
  konnectivityEnabled?: boolean;
  tunnelingAgentIP?: string;
}

export class CNIPluginConfig {
  type: string;
  version: string;
}

export class NetworkRanges {
  cidrBlocks: string[];

  static ipv4CIDR(networkRange: NetworkRanges): string {
    return networkRange?.cidrBlocks?.length ? networkRange.cidrBlocks[0] : null;
  }

  static ipv6CIDR(networkRange: NetworkRanges): string {
    return networkRange?.cidrBlocks?.length > 1 ? networkRange.cidrBlocks[1] : null;
  }
}

export class CNIPluginVersions {
  cniPluginType: string;
  versions: string[];
}

export enum ClusterAnnotation {
  InitialCNIValuesRequest = 'kubermatic.io/initial-cni-values-request',
}

export enum ProxyMode {
  ipvs = 'ipvs',
  iptables = 'iptables',
  ebpf = 'ebpf',
}

export enum ExposeStrategy {
  nodePort = 'NodePort',
  loadbalancer = 'LoadBalancer',
  tunneling = 'Tunneling',
}

export enum CNIPlugin {
  Canal = 'canal',
  Cilium = 'cilium',
  None = 'none',
}

export enum IPFamily {
  IPv4 = 'IPv4',
  DualStack = 'IPv4+IPv6',
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

export class KubernetesDashboard {
  enabled?: boolean;
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
  enableOperatingSystemManager?: boolean;
  eventRateLimitConfig?: EventRateLimitConfig;
  admissionPlugins?: string[];
  opaIntegration?: OPAIntegration;
  clusterNetwork?: ClusterNetwork;
  kubernetesDashboard?: KubernetesDashboard;
  podNodeSelectorAdmissionPluginConfig?: Record<string, string>;
  auditLogging?: AuditLoggingSettings;
  machineNetworks?: MachineNetwork[];
  mla?: MLASettings;
  containerRuntime?: ContainerRuntime;
  cniPlugin?: CNIPluginConfigPatch;
  apiServerAllowedIPRanges?: NetworkRanges;
}

export class CNIPluginConfigPatch {
  version: string;
}

export class CloudSpecPatch {
  anexia?: AnexiaCloudSpecPatch;
  digitalocean?: DigitaloceanCloudSpecPatch;
  nutanix?: NutanixCloudSpecPatch;
  aws?: AWSCloudSpecPatch;
  openstack?: OpenstackCloudSpecPatch;
  packet?: EquinixCloudSpecPatch;
  vsphere?: VSphereCloudSpecPatch;
  hetzner?: HetznerCloudSpecPatch;
  azure?: AzureCloudSpecPatch;
  gcp?: GCPCloudSpecPatch;
  kubevirt?: KubevirtCloudSpecPatch;
  alibaba?: AlibabaCloudSpecPatch;
  vmwareclouddirector?: VMwareCloudDirectorCloudSpecPatch;
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
  project?: string;
  projectID?: string;
  applicationCredentialID?: string;
  applicationCredentialSecret?: string;
  domain?: string;
}

export class EquinixCloudSpecPatch {
  apiKey?: string;
  projectID?: string;
  billingCycle?: string;
}

export class NutanixCloudSpecPatch {
  username: string;
  password: string;
  proxyURL?: string;
  clusterName?: string;
  projectName?: string;
}

export class HetznerCloudSpecPatch {
  token?: string;
}

export class AWSCloudSpecPatch {
  accessKeyID?: string;
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

export class VMwareCloudDirectorCloudSpecPatch {
  username: string;
  password: string;
  apiToken: string;
  organization: string;
  vdc: string;
  ovdcNetwork: string;
}

export class ProviderSettingsPatch {
  cloudSpecPatch: CloudSpecPatch;
  isValid: boolean;
}

export const AVAILABLE_EQUINIX_BILLING_CYCLES = ['hourly', 'daily'];

export const AZURE_LOADBALANCER_SKUS = ['basic', 'standard'];

export class CreateClusterModel {
  cluster: ClusterModel;
  nodeDeployment?: MachineDeployment;
  applications?: Application[];
}

class ClusterModel {
  name: string;
  spec: ClusterSpec;
  labels?: object;
  credential?: string;
  annotations?: Record<ClusterAnnotation | string, string>;
}

export class ProjectClusterList {
  clusters: Cluster[];
  errorMessage: string;
}
