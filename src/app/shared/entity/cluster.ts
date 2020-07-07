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

export const enum Finalizer {
  DeleteVolumes = 'DeleteVolumes',
  DeleteLoadBalancers = 'DeleteLoadBalancers',
}

export enum ClusterType {
  Kubernetes = 'kubernetes',
  OpenShift = 'openshift',
  Empty = '',
}

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

  static getProvider(cloud: CloudSpec): string {
    if (cloud.aws) {
      return 'aws';
    } else if (cloud.digitalocean) {
      return 'digitalocean';
    } else if (cloud.openstack) {
      return 'openstack';
    } else if (cloud.bringyourown) {
      return 'bringyourown';
    } else if (cloud.hetzner) {
      return 'hetzner';
    } else if (cloud.vsphere) {
      return 'vsphere';
    } else if (cloud.azure) {
      return 'azure';
    } else if (cloud.packet) {
      return 'packet';
    } else if (cloud.gcp) {
      return 'gcp';
    } else if (cloud.kubevirt) {
      return 'kubevirt';
    } else if (cloud.alibaba) {
      return 'alibaba';
    }
  }

  static isOpenshiftType(cluster: Cluster): boolean {
    return cluster.type === ClusterType.OpenShift;
  }

  static getDisplayType(cluster: Cluster): string {
    switch (cluster.type) {
      case ClusterType.Kubernetes:
        return 'Kubernetes';
      case ClusterType.OpenShift:
        return 'OpenShift';
      default:
        return '';
    }
  }

  static getVersionHeadline(type: string, isKubelet: boolean): string {
    if (type === 'kubernetes') {
      return isKubelet ? 'kubelet Version' : 'Master Version';
    } else if (type === 'openshift') {
      return 'OpenShift Version';
    }
  }

  static newEmptyClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {} as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}

export function getClusterProvider(cluster: Cluster): NodeProvider {
  const clusterProviders = Object.values(NodeProvider)
    .map(provider => (cluster.spec.cloud[provider] ? provider : undefined))
    .filter(p => p !== undefined);

  return clusterProviders.length > 0 ? clusterProviders[0] : NodeProvider.NONE;
}

export class CloudSpec {
  dc: string;
  digitalocean?: DigitaloceanCloudSpec;
  aws?: AWSCloudSpec;
  bringyourown?: BringYourOwnCloudSpec;
  openstack?: OpenstackCloudSpec;
  packet?: PacketCloudSpec;
  baremetal?: BareMetalCloudSpec;
  vsphere?: VSphereCloudSpec;
  hetzner?: HetznerCloudSpec;
  azure?: AzureCloudSpec;
  fake?: FakeCloudSpec;
  gcp?: GCPCloudSpec;
  kubevirt?: KubeVirtCloudSpec;
  alibaba?: AlibabaCloudSpec;
}

export class AlibabaCloudSpec {
  accessKeyID: string;
  accessKeySecret: string;
}

export class AWSCloudSpec {
  accessKeyId: string;
  secretAccessKey: string;
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
  routeTable: string;
  securityGroup: string;
  subnet: string;
  subscriptionID: string;
  tenantID: string;
  vnet: string;
}

export class BareMetalCloudSpec {
  name: string;
}

export class BringYourOwnCloudSpec {}

export class DigitaloceanCloudSpec {
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
}

export class KubeVirtCloudSpec {
  kubeconfig: string;
}

export class OpenstackCloudSpec {
  username: string;
  password: string;
  tenant: string;
  tenantID: string;
  domain: string;
  network: string;
  securityGroups: string;
  floatingIpPool: string;
  subnetID: string;
}

export class PacketCloudSpec {
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
}

export class VSphereInfraManagementUser {
  username: string;
  password: string;
}

export class ClusterSpec {
  cloud: CloudSpec;
  machineNetworks?: MachineNetwork[];
  auditLogging?: AuditLoggingSettings;
  version?: string;
  usePodSecurityPolicyAdmissionPlugin?: boolean;
  usePodNodeSelectorAdmissionPlugin?: boolean;
  admissionPlugins?: string[];
  openshift?: OpenShift;
}

export class AuditLoggingSettings {
  enabled?: boolean;
}

export class OpenShift {
  imagePullSecret?: string;
}

export class MachineNetwork {
  cidr: string;
  dnsServers: string[];
  gateway: string;
}

export class Status {
  url: string;
  version: string;
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
  admissionPlugins?: string[];
  auditLogging?: AuditLoggingSettings;
  openshift?: OpenShiftPatch;
}

export class OpenShiftPatch {
  imagePullSecret?: string;
}

export class CloudSpecPatch {
  digitalocean?: DigitaloceanCloudSpecPatch;
  aws?: AWSCloudSpecPatch;
  openstack?: OpenstackCloudSpecPatch;
  packet?: PacketCloudSpecPatch;
  vsphere?: VSphereCloudSpecPatch;
  hetzner?: HetznerCloudSpecPatch;
  azure?: AzureCloudSpecPatch;
  gcp?: GCPCloudSpecPatch;
  kubevirt?: KubevirtCloudSpecPatch;
  alibaba?: AlibabaCloudSpecPatch;
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

export class PacketCloudSpecPatch {
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
        tenant: '',
        tenantID: '',
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
      } as AzureCloudSpec;
    case NodeProvider.PACKET:
      return {} as PacketCloudSpec;
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
  }
  return {};
}

export const AVAILABLE_PACKET_BILLING_CYCLES = ['hourly', 'daily'];
