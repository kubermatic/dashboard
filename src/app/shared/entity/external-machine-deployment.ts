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
import {HealthStatusColor} from '@shared/utils/health-status/health-status';

export class ExternalMachineDeployment extends MachineDeployment {
  cloud?: ExternalMachineDeploymentCloudSpec;

  static getStatusColor(md: ExternalMachineDeployment): string {
    if (md?.deletionTimestamp) {
      return HealthStatusColor.Red;
    } else if (md?.status?.readyReplicas === md?.status?.replicas) {
      return HealthStatusColor.Green;
    }
    return HealthStatusColor.Orange;
  }
}

class ExternalMachineDeploymentCloudSpec {
  gke?: GKEMachineDeploymentCloudSpec;
}

class GKEMachineDeploymentCloudSpec {
  autoscaling?: GKENodePoolAutoscaling;
  config?: GKENodeConfig;
  management?: GKENodeManagement;
  locations?: string[];
  string;
}

class GKENodePoolAutoscaling {
  autoprovisioned?: boolean;
  enabled?: boolean;
  maxNodeCount?: number;
  minNodeCount?: number;
}

class GKENodeConfig {
  diskSizeGb?: number;
  diskType?: string;
  imageType?: string;
  localSsdCount?: number;
  machineType?: string;
  labels?: Map<string, string>;
}

class GKENodeManagement {
  autoRepair?: boolean;
  autoUpgrade?: boolean;
}
