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

import {HealthStatusColor} from '@shared/utils/health-status/health-status';

export enum ExternalClusterProvider {
  Custom = 'custom',
  AKS = 'aks',
  EKS = 'eks',
  GKE = 'gke',
}

export class ExternalCluster {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  labels?: object;
  spec: ExternalClusterSpec;
  cloud: ExternalCloudSpec;
  status: ExternalClusterStatus;

  static getProvider(cloud: ExternalCloudSpec): ExternalClusterProvider {
    const providers = Object.keys(cloud);
    return providers.length > 0
      ? (providers.pop().toLowerCase() as ExternalClusterProvider)
      : ExternalClusterProvider.Custom;
  }

  static getStatusColor(state: ExternalClusterState): string {
    switch (state) {
      case ExternalClusterState.Running:
        return HealthStatusColor.Green;
      case ExternalClusterState.Provisioning:
      case ExternalClusterState.Reconciling:
        return HealthStatusColor.Orange;
      case ExternalClusterState.Deleting:
      case ExternalClusterState.Error:
        return HealthStatusColor.Red;
      case ExternalClusterState.Unknown:
      default:
        return HealthStatusColor.Unknown;
    }
  }
}

export class ExternalClusterSpec {
  version: string;
}

export class ExternalCloudSpec {
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

export enum ExternalClusterState {
  Provisioning = 'PROVISIONING',
  Running = 'RUNNING',
  Reconciling = 'RECONCILING',
  Deleting = 'DELETING',
  Error = 'ERROR',
  Unknown = 'UNKNOWN',
}

export class ExternalClusterStatus {
  state: ExternalClusterState;
  statusMessage: string;
}

export class AKSCluster {
  name: string;
  resourceGroup: string;
  imported: boolean;
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

export class ExternalClusterModel {
  name: string;
  kubeconfig?: string;
  cloud?: ExternalCloudSpec;

  static new(): ExternalClusterModel {
    return {name: ''};
  }
}
