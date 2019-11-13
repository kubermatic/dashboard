export class AdminSettings {
  cleanupOptions: CleanupOptions;
  clusterTypeOptions: ClusterTypeOptions;
  defaultNodeCount: number;
}

export class CleanupOptions {
  Enabled: boolean;
  Enforced: boolean;
}

export enum ClusterTypeOptions {
  All,
  Kubernetes,
  OpenShift,
}
