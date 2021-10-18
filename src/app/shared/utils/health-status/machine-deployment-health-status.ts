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

import {MachineDeployment} from '../../entity/machine-deployment';
import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export class MachineDeploymentHealthStatus extends HealthStatus {
  static getHealthStatus(md: MachineDeployment): MachineDeploymentHealthStatus {
    if (md.deletionTimestamp) {
      return new MachineDeploymentHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red);
    } else if (md.status && md.status.availableReplicas === md.spec.replicas) {
      return new MachineDeploymentHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green);
    } else if (md.status && md.status.updatedReplicas !== md.spec.replicas) {
      return new MachineDeploymentHealthStatus(HealthStatusMessage.Updating, HealthStatusColor.Orange);
    }
    return new MachineDeploymentHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange);
  }

  constructor(message: HealthStatusMessage, color: HealthStatusColor) {
    super(message, color);
  }
}
