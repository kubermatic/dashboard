// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {MachineDeployment, MachineDeploymentStatus} from '@shared/entity/machine-deployment';

export const CLUSTER_DEFAULT_NODE_SELECTOR_NAMESPACE = 'clusterDefaultNodeSelector';
export const CLUSTER_DEFAULT_NODE_SELECTOR_TOOLTIP =
  'Namespace clusterDefaultNodeSelector requires nodes with the labels defined in the Label Selector to start the cluster. The labels are enforced. Edit the label in the Label Selector.';
export const CLUSTER_DEFAULT_NODE_SELECTOR_HINT =
  'Namespace <b>clusterDefaultNodeSelector</b> requires nodes with the labels defined in the Label Selector to start the cluster. The labels are enforced.';

export function getClusterMachinesCount(machineDeployments: MachineDeployment[]): MachineDeploymentStatus {
  const mdStatus: MachineDeploymentStatus = {
    replicas: 0,
    availableReplicas: 0,
    updatedReplicas: 0,
    readyReplicas: 0,
    unavailableReplicas: 0,
  } as MachineDeploymentStatus;
  machineDeployments.forEach(machineDeployment => {
    mdStatus.replicas += machineDeployment.status?.replicas || 0;
    mdStatus.availableReplicas += machineDeployment.status?.availableReplicas || 0;
    mdStatus.updatedReplicas += machineDeployment.status?.updatedReplicas || 0;
    mdStatus.readyReplicas += machineDeployment.status?.readyReplicas || 0;
    mdStatus.unavailableReplicas += machineDeployment.status?.unavailableReplicas || 0;
  });

  return mdStatus;
}

export function generateEncryptionKey(): string {
  const byteLength = 32;
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  // Convert bytes → binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Encode to Base64
  return btoa(binary);
}
