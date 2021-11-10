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

import {machineDeploymentsFake} from '@app/testing/fake-data/node';

import {HealthStatusColor, HealthStatusMessage} from './health-status';
import {MachineDeploymentHealthStatus} from './machine-deployment-health-status';

describe('MachineDeploymentHealthStatus', () => {
  it('should return correct status for machine deployments', () => {
    const mds = machineDeploymentsFake();

    expect(MachineDeploymentHealthStatus.getHealthStatus(mds[0])).toEqual(
      new MachineDeploymentHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green)
    );
    expect(MachineDeploymentHealthStatus.getHealthStatus(mds[1])).toEqual(
      new MachineDeploymentHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange)
    );
  });
});
