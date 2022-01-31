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

export enum StatusIcon {
  Running = 'km-icon-circle km-success-bg',
  Pending = 'km-icon-circle km-warning-bg', // TODO
  Error = 'km-icon-error',
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
    return new HealthStatus('Running', StatusIcon.Error);
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
