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

import {Node} from '../../entity/node';

import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export enum HealthStatusCss {
  Deleting = 'km-status-deleting',
  Failed = 'km-status-failed',
  Running = 'km-status-running',
  Provisioning = 'km-status-waiting',
}

export class NodeHealthStatus extends HealthStatus {
  static getHealthStatus(n: Node): NodeHealthStatus {
    if (n.deletionTimestamp) {
      return new NodeHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red, HealthStatusCss.Deleting);
    } else if (n.status.errorMessage) {
      return new NodeHealthStatus(HealthStatusMessage.Failed, HealthStatusColor.Red, HealthStatusCss.Failed);
    } else if (n.status.nodeInfo.kubeletVersion) {
      return new NodeHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running);
    }
    return new NodeHealthStatus(
      HealthStatusMessage.Provisioning,
      HealthStatusColor.Orange,
      HealthStatusCss.Provisioning
    );
  }

  css: string;

  constructor(message: HealthStatusMessage, color: HealthStatusColor, css: string) {
    super(message, color);
    this.css = css;
  }
}
