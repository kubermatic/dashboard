export class AdminSettings {
  cleanupOptions: CleanupOptions;
  clusterTypeOptions: number;  // TODO: Change it to enum.
  defaultNodeCount: number;
}

export class CleanupOptions {
  Enabled: boolean;
  Enforced: boolean;
}
