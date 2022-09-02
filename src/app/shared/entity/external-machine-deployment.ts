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

import {MachineDeployment} from '@shared/entity/machine-deployment';
import {HealthStatus, StatusIcon} from '@shared/utils/health-status';
import {AKSMachineDeploymentCloudSpec} from './provider/aks';
import {GKENodeConfig} from './provider/gke';

export enum AKSMachineDeploymentMode {
  User = 'User',
  System = 'System',
}

export enum ExternalClusterMDState {
  Provisioning = 'Provisioning',
  Running = 'Running',
  Reconciling = 'Reconciling',
  Deleting = 'Deleting',
  Error = 'Error',
  Unknown = 'Unknown',
}

export class ExternalMachineDeployment extends MachineDeployment {
  phase?: ExternalClusterMDPhase;
  cloud: ExternalMachineDeploymentCloudSpec;

  static getHealthStatus(md: ExternalMachineDeployment): HealthStatus {
    switch (md.phase?.state) {
      case ExternalClusterMDState.Deleting:
        return new HealthStatus(ExternalClusterMDState.Deleting, StatusIcon.Error);
      case ExternalClusterMDState.Running:
        return new HealthStatus(ExternalClusterMDState.Running, StatusIcon.Running);
      case ExternalClusterMDState.Reconciling:
        return new HealthStatus(ExternalClusterMDState.Reconciling, StatusIcon.Pending);
      case ExternalClusterMDState.Provisioning:
        return new HealthStatus(ExternalClusterMDState.Provisioning, StatusIcon.Pending);
      case ExternalClusterMDState.Error:
        return new HealthStatus(md.phase?.statusMessage || ExternalClusterMDState.Error, StatusIcon.Error);
      default:
        return new HealthStatus(ExternalClusterMDState.Unknown, StatusIcon.Unknown);
    }
  }

  static NewEmptyMachineDeployment(): ExternalMachineDeployment {
    return {
      cloud: {},
    };
  }
}

export class ExternalMachineDeploymentCloudSpec {
  gke?: GKEMachineDeploymentCloudSpec;
  eks?: EKSMachineDeploymentCloudSpec;
  aks?: AKSMachineDeploymentCloudSpec;
}

export class GKEMachineDeploymentCloudSpec {
  autoscaling?: GKENodePoolAutoscaling;
  config?: GKENodeConfig;
  management?: GKENodeManagement;
  locations?: string[];
  string;
}

export class EKSMachineDeploymentCloudSpec {
  diskSize: number;
  scalingConfig: EKSScalingConfig;
  nodeRole: string;
  subnets: string[];
}

export class EKSScalingConfig {
  desiredSize: number;
  maxSize: number;
  minSize?: number;
}

export class GKENodePoolAutoscaling {
  autoprovisioned?: boolean;
  enabled?: boolean;
  maxNodeCount?: number;
  minNodeCount?: number;
}

class GKENodeManagement {
  autoRepair?: boolean;
  autoUpgrade?: boolean;
}

export class ExternalMachineDeploymentPatch {
  spec?: ExternalMachineDeploymentSpecPatch;
}

export class ExternalMachineDeploymentSpecPatch {
  replicas?: number;
  template?: {
    versions: {
      kubelet: string;
    };
  };
}

export class ExternalClusterMDPhase {
  state: ExternalClusterMDState;
  statusMessage?: string;
}
