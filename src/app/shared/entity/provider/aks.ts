// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

export class AKSCluster {
  name: string;
  resourceGroup: string;
  imported: boolean;
}

export class AKSVMSize {
  name?: string;
  numberOfCores?: number;
  numberOfGPUs?: number;
  osDiskSizeInMB?: number;
  resourceDiskSizeInMB?: number;
  memoryInMB?: number;
  maxDataDiskCount?: number;
}

export class AKSCloudSpec {
  name: string;
  tenantID?: string;
  subscriptionID?: string;
  clientID?: string;
  clientSecret?: string;
  resourceGroup?: string;
}

export class AKSClusterSpec {
  location: string;
  kubernetesVersion: string;
  nodeResourceGroup?: string;
  enableRBAC?: boolean;
  managedAAD?: boolean;
  dnsPrefix?: string;
  fqdnSubdomain?: string;
  fqdn?: string;
  privateFQDN?: string;
  machineDeploymentSpec?: AKSMachineDeploymentCloudSpec;
  networkProfile?: AKSNetworkProfile;
}

export class AKSMachineDeploymentCloudSpec {
  name: string;
  basicSettings: AgentPoolBasics;
  optionalSettings?: AgentPoolOptionalSettings;
  configuration?: AgentPoolConfig;
}

export class AgentPoolBasics {
  count: number;
  vmSize: string;
  mode?: string;
  orchestratorVersion?: string;
  availabilityZones?: string[];
  enableAutoScaling?: boolean;
  scalingConfig?: AKSNodegroupScalingConfig;
  osDiskSizeGB?: number;
}

export class AKSNodegroupScalingConfig {
  maxCount?: number;
  minCount?: number;
}

export class AgentPoolOptionalSettings {
  nodeLabels?: {[key: string]: string | undefined};
  nodeTaints?: string[];
}

export class AgentPoolConfig {
  osDiskType?: string;
  maxPods?: number;
  osType?: string;
  enableNodePublicIP?: boolean;
  maxSurge?: string;
  vnetSubnetID?: string;
  podSubnetID?: string;
}

export class AKSNetworkProfile {
  podCidr?: string;
  serviceCidr?: string;
  dnsServiceIP?: string;
  dockerBridgeCidr?: string;
  networkPlugin?: string;
  networkPolicy?: string;
  networkMode?: string;
  outboundType?: string;
  loadBalancerSku?: string;
}

export class AKSNodePoolVersionForMachineDeployments {
  version: string;
}
