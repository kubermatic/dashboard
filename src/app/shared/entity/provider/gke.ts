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
  diskSizeGb?: number;
  diskType?: string;
  imageType?: string;
  localSsdCount?: number;
  machineType?: string;
  labels?: object;
  preemptible?: boolean;
}
