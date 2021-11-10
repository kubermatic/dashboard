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

import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster';
import {fakeHealth, fakeHealthFailed, fakeHealthProvisioning} from '@app/testing/fake-data/health';

import {ClusterHealthStatus, HealthStatusCss} from './cluster-health-status';
import {HealthStatusColor, HealthStatusMessage} from './health-status';

describe('ClusterHealthStatus', () => {
  const cluster = fakeDigitaloceanCluster();
  const health = fakeHealth();
  const healthProvisioning = fakeHealthProvisioning();
  const healthFailed = fakeHealthFailed();

  it('should return correct status for clusters', () => {
    expect(ClusterHealthStatus.getHealthStatus(cluster, health)).toEqual(
      new ClusterHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running)
    );
    expect(ClusterHealthStatus.getHealthStatus(cluster, healthProvisioning)).toEqual(
      new ClusterHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange, HealthStatusCss.Provisioning)
    );
  });

  it('should return if cluster is running', () => {
    expect(ClusterHealthStatus.isClusterAPIRunning(cluster, health)).toBeTruthy();
    expect(ClusterHealthStatus.isClusterAPIRunning(cluster, healthFailed)).toBeFalsy();
  });
});
