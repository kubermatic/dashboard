// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Health, HealthState} from '@shared/entity/health';

export function fakeHealth(): Health {
  return {
    apiserver: HealthState.up,
    controller: HealthState.up,
    etcd: HealthState.up,
    machineController: HealthState.up,
    scheduler: HealthState.up,
    cloudProviderInfrastructure: HealthState.up,
    userClusterControllerManager: HealthState.up,
  };
}

export function fakeHealthProvisioning(): Health {
  return {
    apiserver: HealthState.up,
    controller: HealthState.up,
    etcd: HealthState.provisioning,
    machineController: HealthState.up,
    scheduler: HealthState.provisioning,
    cloudProviderInfrastructure: HealthState.down,
    userClusterControllerManager: HealthState.provisioning,
  };
}

export function fakeHealthFailed(): Health {
  return {
    apiserver: HealthState.down,
    controller: HealthState.down,
    etcd: HealthState.down,
    machineController: HealthState.down,
    scheduler: HealthState.down,
    cloudProviderInfrastructure: HealthState.down,
    userClusterControllerManager: HealthState.down,
  };
}
