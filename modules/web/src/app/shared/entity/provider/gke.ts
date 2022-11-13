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

export class GKECluster {
  name: string;
  zone: string;
  imported: boolean;
}

export class GKECloudSpec {
  name: string;
  serviceAccount?: string;
  zone?: string;
  clusterSpec?: GKEClusterSpec;
}

export class GKEClusterSpec {
  autopilot?: boolean;
  autoscaling?: GKEClusterAutoscaling;
  releaseChannel?: string;
  clusterIpv4Cidr?: string;
  defaultMaxPodsConstraint?: number;
  enableKubernetesAlpha?: boolean;
  enableTpu?: boolean;
  initialClusterVersion?: string;
  initialNodeCount?: number;
  locations?: string[];
  network?: string;
  nodeConfig?: GKENodeConfig;
  subnetwork?: string;
  tpuIpv4CidrBlock?: string;
  verticalPodAutoscaling?: boolean;
}

export class GKEClusterAutoscaling {
  autoprovisioningLocations?: string[];
  autoprovisioningNodePoolDefaults?: GKEAutoprovisioningNodePoolDefaults;
  enableNodeAutoprovisioning?: boolean;
  resourceLimits?: GKEResourceLimit[];
}

export class GKEAutoprovisioningNodePoolDefaults {
  bootDiskKmsKey?: string;
  diskSizeGb?: number;
  diskType?: string;
  management?: GKENodeManagement;
  minCpuPlatform?: string;
  oauthScopes?: string[];
  serviceAccount?: string;
  shieldedInstanceConfig?: GKEShieldedInstanceConfig;
  upgradeSettings?: GKEUpgradeSettings;
}

export class GKENodeManagement {
  autoRepair?: boolean;
  autoUpgrade?: boolean;
}

export class GKEShieldedInstanceConfig {
  enableIntegrityMonitoring?: boolean;
  enableSecureBoot?: boolean;
}

export class GKEUpgradeSettings {
  maxSurge?: number;
  maxUnavailable?: number;
}

export class GKEResourceLimit {
  maximum?: number;
  minimum?: number;
  resourceType?: string;
}

export class GKENodeConfig {
  name?: string;
  diskSizeGb?: number;
  diskType?: string;
  imageType?: string;
  localSsdCount?: number;
  machineType?: string;
  labels?: object;
  preemptible?: boolean;
}

export class GKEZone {
  name: string;
}
