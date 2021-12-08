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

export enum ExternalClusterProvider {
  Custom = 'custom',
  AKS = 'aks',
  EKS = 'eks',
  GKE = 'gke',
}

export class ExternalCluster {
  name: string;
  kubeconfig?: string;
  cloud?: ExternalClusterCloudSpec;

  static new(): ExternalCluster {
    return {name: ''};
  }
}

export class ExternalClusterCloudSpec {
  aks?: AKSCloudSpec;
  eks?: EKSCloudSpec;
  gke?: GKECloudSpec;
}

export class AKSCloudSpec {
  name: string;
  tenantID?: string;
  subscriptionID?: string;
  clientID?: string;
  clientSecret?: string;
  resourceGroup?: string;
}

export class EKSCloudSpec {
  name: string;
  accessKeyID?: string;
  secretAccessKey?: string;
  region?: string;
}

export class GKECloudSpec {
  name: string;
  serviceAccount?: string;
  zone?: string;
}

export class EKSCluster {
  name: string;
  region: string;
  imported: boolean;
}

export class GKECluster {
  name: string;
  zone: string;
  imported: boolean;
}
