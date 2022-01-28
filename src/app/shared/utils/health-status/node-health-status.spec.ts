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

import {nodesFake} from '../../../../test/data/node';

import {HealthStatusColor, HealthStatusMessage} from './health-status';
import {HealthStatusCss, NodeHealthStatus} from './node-health-status';

describe('NodeHealthStatus', () => {
  it('should return correct status for nodes', () => {
    const ns = nodesFake();

    expect(NodeHealthStatus.getHealthStatus(ns[0])).toEqual(
      new NodeHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running)
    );
    expect(NodeHealthStatus.getHealthStatus(ns[1])).toEqual(
      new NodeHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange, HealthStatusCss.Provisioning)
    );
  });
});
