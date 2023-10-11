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

import {NodeCloudSpec, NodeSpec, NodeVersionInfo, OperatingSystemSpec, Taint} from './node';

export class MachineDeployment {
  annotations?: object;
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name?: string;
  spec?: MachineDeploymentSpec;
  status?: MachineDeploymentStatus;
}

export class MachineDeploymentSpec {
  replicas?: number;
  template?: NodeSpec;
  paused?: boolean;
  dynamicConfig?: boolean;
  minReplicas?: number;
  maxReplicas?: number;
}

export class MachineDeploymentStatus {
  observedGeneration?: number;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
}

export class MachineDeploymentPatch {
  annotations?: object;
  spec: MachineDeploymentSpecPatch;
}

export class MachineDeploymentSpecPatch {
  replicas?: number;
  template?: NodeSpecPatch;
  paused?: boolean;
  dynamicConfig?: boolean;
  minReplicas?: number;
  maxReplicas?: number;
}

export class NodeSpecPatch {
  cloud?: NodeCloudSpec;
  operatingSystem?: OperatingSystemSpec;
  versions?: NodeVersionInfo;
  labels?: object;
  taints?: Taint[];
}

export const OPERATING_SYSTEM_PROFILE_ANNOTATION = 'k8c.io/operating-system-profile';
