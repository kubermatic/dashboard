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

import {Cluster} from '../../entity/cluster';
import {Health, HealthState} from '../../entity/health';

import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export enum HealthStatusCss {
  Deleting = 'km-status-deleting',
  Failed = 'km-status-failed',
  Running = 'km-status-running',
  Provisioning = 'km-status-waiting',
}

export class ClusterHealthStatus extends HealthStatus {
  static getHealthStatus(c: Cluster, h: Health): ClusterHealthStatus {
    if (c.deletionTimestamp) {
      return new ClusterHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red, HealthStatusCss.Deleting);
    } else if (this.isClusterRunning(c, h)) {
      return new ClusterHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running);
    }
    return new ClusterHealthStatus(
      HealthStatusMessage.Provisioning,
      HealthStatusColor.Orange,
      HealthStatusCss.Provisioning
    );
  }

  static isClusterRunning(c: Cluster, h: Health): boolean {
    if (c.spec.cloud.bringyourown) {
      return true;
    }

    return !!h && Health.allHealthy(h) && !c.deletionTimestamp;
  }

  static isClusterAPIRunning(c: Cluster, h: Health): boolean {
    return !!h && HealthState.isUp(h.apiserver) && !c.deletionTimestamp;
  }

  css: string;

  constructor(message: HealthStatusMessage, color: HealthStatusColor, css: string) {
    super(message, color);
    this.css = css;
  }
}
