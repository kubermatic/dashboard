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

import _ from 'lodash';
import {StatusIcon} from '@shared/utils/health-status';
import {GKECloudSpec} from './provider/gke';
import {EKSCloudSpec, EKSClusterSpec} from './provider/eks';
import {AKSCloudSpec} from './provider/aks';

export enum ExternalClusterProvider {
  Custom = 'custom',
  AKS = 'aks',
  EKS = 'eks',
  GKE = 'gke',
}

const PROVIDER_DISPLAY_NAMES = new Map<ExternalClusterProvider, string>([
  [ExternalClusterProvider.AKS, 'AKS'],
  [ExternalClusterProvider.EKS, 'EKS'],
  [ExternalClusterProvider.GKE, 'GKE'],
  [ExternalClusterProvider.Custom, 'Custom'],
]);

export function getExternalProviderDisplayName(provider: ExternalClusterProvider): string {
  return PROVIDER_DISPLAY_NAMES.get(provider);
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
    if (!cloud) {
      return ExternalClusterProvider.Custom;
    }

    const providers = Object.keys(cloud);
    return providers.length > 0
      ? (providers.pop().toLowerCase() as ExternalClusterProvider)
      : ExternalClusterProvider.Custom;
  }

  static getProviderDisplayName(cloud: ExternalCloudSpec): string {
    return getExternalProviderDisplayName(ExternalCluster.getProvider(cloud));
  }

  static getStatusMessage(cluster: ExternalCluster): string {
    const state = _.capitalize(cluster?.status?.state);
    return cluster?.status?.statusMessage ? `${state}: ${cluster?.status.statusMessage}` : state;
  }

  static getStatusIcon(cluster: ExternalCluster): string {
    switch (cluster?.status?.state) {
      case ExternalClusterState.Running:
        return StatusIcon.Running;
      case ExternalClusterState.Provisioning:
      case ExternalClusterState.Reconciling:
        return StatusIcon.Pending;
      case ExternalClusterState.Deleting:
      case ExternalClusterState.Error:
        return StatusIcon.Error;
      case ExternalClusterState.Unknown:
      default:
        return StatusIcon.Unkown;
    }
  }
}

class ExternalClusterSpec {
  eksclusterSpec?: EKSClusterSpec;
  version: string;
}

export class ExternalCloudSpec {
  aks?: AKSCloudSpec;
  eks?: EKSCloudSpec;
  gke?: GKECloudSpec;
}

export enum ExternalClusterState {
  Provisioning = 'Provisioning',
  Running = 'Running',
  Reconciling = 'Reconciling',
  Stopping = 'Stopping',
  Stopped = 'Stopped',
  Deleting = 'Deleting',
  Error = 'Error',
  Unknown = 'Unknown',
}

export class ExternalClusterStatus {
  state: ExternalClusterState;
  statusMessage: string;
}

export class ExternalClusterPatch {
  spec?: ExternalClusterSpecPatch;
}

export class ExternalClusterSpecPatch {
  version?: string;
}

export class ExternalClusterModel {
  name: string;
  kubeconfig?: string;
  cloud?: ExternalCloudSpec;
  spec?: ExternalClusterSpec;

  static new(): ExternalClusterModel {
    return {name: ''};
  }
}
