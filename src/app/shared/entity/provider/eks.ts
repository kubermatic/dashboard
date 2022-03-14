export class EKSCluster {
  name: string;
  region: string;
  imported: boolean;
}

export class EKSCloudSpec {
  name: string;
  accessKeyID?: string;
  secretAccessKey?: string;
  region?: string;
}
