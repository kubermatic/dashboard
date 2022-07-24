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

import {Cluster} from '@shared/entity/cluster';
import {Health, HealthState} from '@shared/entity/health';
import {Node} from '@shared/entity/node';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {EtcdBackupConfig, EtcdBackupConfigCondition} from '@shared/entity/backup';

export enum StatusIcon {
  Running = 'km-icon-running',
  Pending = 'km-icon-pending',
  Error = 'km-icon-error',
  Disabled = 'km-icon-disabled',
  Unknown = 'km-icon-unknown',
}

export class HealthStatus {
  message: string;
  icon: StatusIcon;

  constructor(message: string, icon: StatusIcon) {
    this.message = message;
    this.icon = icon;
  }
}

export function getClusterHealthStatus(c: Cluster, h: Health): HealthStatus {
  if (c.deletionTimestamp) {
    return new HealthStatus('Deleting', StatusIcon.Error);
  } else if (isClusterRunning(c, h)) {
    return new HealthStatus('Running', StatusIcon.Running);
  }
  return new HealthStatus('Provisioning', StatusIcon.Pending);
}

export function isClusterRunning(c: Cluster, h: Health): boolean {
  return !!c && !!h && Health.allHealthy(h) && !c.deletionTimestamp;
}

export function isClusterAPIRunning(c: Cluster, h: Health): boolean {
  return !!h && HealthState.isUp(h.apiserver) && !c.deletionTimestamp;
}

export function isOPARunning(c: Cluster, h: Health): boolean {
  return !!h && HealthState.isUp(h.gatekeeperAudit) && HealthState.isUp(h.gatekeeperController) && !c.deletionTimestamp;
}

export function getNodeHealthStatus(n: Node): HealthStatus {
  if (n.deletionTimestamp) {
    return new HealthStatus('Deleting', StatusIcon.Error);
  } else if (n.status.errorMessage) {
    return new HealthStatus('Failed', StatusIcon.Error);
  } else if (n.status.nodeInfo.kubeletVersion) {
    return new HealthStatus('Running', StatusIcon.Running);
  }
  return new HealthStatus('Provisioning', StatusIcon.Pending);
}

export function getMachineDeploymentHealthStatus(md: MachineDeployment): HealthStatus {
  if (md.deletionTimestamp) {
    return new HealthStatus('Deleting', StatusIcon.Error);
  } else if (
    md.status &&
    md.status.availableReplicas === md.spec.replicas &&
    md.status.availableReplicas === md.status.updatedReplicas
  ) {
    return new HealthStatus('Running', StatusIcon.Running);
  } else if (md.status && md.status.updatedReplicas !== md.spec.replicas) {
    return new HealthStatus('Updating', StatusIcon.Pending);
  }
  return new HealthStatus('Provisioning', StatusIcon.Pending);
}

export function getBackupHealthStatus(backup: EtcdBackupConfig, condition: EtcdBackupConfigCondition): HealthStatus {
  if (backup.deletionTimestamp) {
    return new HealthStatus('Deleting', StatusIcon.Error);
  } else if (condition.status === 'True') {
    return new HealthStatus('Running', StatusIcon.Running);
  } else if (condition.status === 'False') {
    return new HealthStatus('Disabled', StatusIcon.Disabled);
  }
  return new HealthStatus('Unknown', StatusIcon.Unknown);
}
