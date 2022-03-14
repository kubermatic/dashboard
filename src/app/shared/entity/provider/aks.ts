export class AKSCluster {
  name: string;
  resourceGroup: string;
  imported: boolean;
}

export class AKSCloudSpec {
  name: string;
  tenantID?: string;
  subscriptionID?: string;
  clientID?: string;
  clientSecret?: string;
  resourceGroup?: string;
}
