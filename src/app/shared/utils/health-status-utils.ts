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
  Disabled = 'km-icon-circle km-unknown-bg', // TODO
  Unkown = 'km-icon-circle km-unknown-bg', // TODO
}

export class HealthStatusUtils {
  message: string;
  icon: StatusIcon;

  constructor(message: string, icon: StatusIcon) {
    this.message = message;
    this.icon = icon;
  }
}

export function getClusterHealthStatus(c: Cluster, h: Health): HealthStatusUtils {
  if (c.deletionTimestamp) {
    return new HealthStatusUtils('Deleting', StatusIcon.Error);
  } else if (isClusterRunning(c, h)) {
    return new HealthStatusUtils('Running', StatusIcon.Running);
  }
  return new HealthStatusUtils('Provisioning', StatusIcon.Pending);
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

export function getNodeHealthStatus(n: Node): HealthStatusUtils {
  if (n.deletionTimestamp) {
    return new HealthStatusUtils('Deleting', StatusIcon.Error);
  } else if (n.status.errorMessage) {
    return new HealthStatusUtils('Failed', StatusIcon.Error);
  } else if (n.status.nodeInfo.kubeletVersion) {
    return new HealthStatusUtils('Running', StatusIcon.Running);
  }
  return new HealthStatusUtils('Provisioning', StatusIcon.Pending);
}

export function getMachineDeploymentHealthStatus(md: MachineDeployment): HealthStatusUtils {
  if (md.deletionTimestamp) {
    return new HealthStatusUtils('Deleting', StatusIcon.Error);
  } else if (md.status && md.status.availableReplicas === md.spec.replicas) {
    return new HealthStatusUtils('Running', StatusIcon.Running);
  } else if (md.status && md.status.updatedReplicas !== md.spec.replicas) {
    return new HealthStatusUtils('Updating', StatusIcon.Pending);
  }
  return new HealthStatusUtils('Provisioning', StatusIcon.Pending);
}

export function getBackupHealthStatus(
  backup: EtcdBackupConfig,
  condition: EtcdBackupConfigCondition
): HealthStatusUtils {
  if (backup.deletionTimestamp) {
    return new HealthStatusUtils('Deleting', StatusIcon.Error);
  } else if (condition.status === 'True') {
    return new HealthStatusUtils('Running', StatusIcon.Running);
  } else if (condition.status === 'False') {
    return new HealthStatusUtils('Disabled', StatusIcon.Disabled);
  }
  return new HealthStatusUtils('Unknown', StatusIcon.Unkown);
}
