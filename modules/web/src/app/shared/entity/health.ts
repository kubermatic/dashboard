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

import {Provider} from '@shared/entity/cluster';

export class Health {
  apiserver: HealthState;
  controller: HealthState;
  etcd: HealthState;
  machineController: HealthState;
  scheduler: HealthState;
  cloudProviderInfrastructure: HealthState;
  userClusterControllerManager: HealthState;
  gatekeeperAudit?: HealthState;
  gatekeeperController?: HealthState;
  mlaGateway?: HealthState;
  alertmanagerConfig?: HealthState;
  logging?: HealthState;
  monitoring?: HealthState;
  kubernetesDashboard?: HealthState;
  operatingSystemManager?: HealthState;

  static allHealthy(health: Health, provider: Provider): boolean {
    const supported = [
      health.apiserver,
      health.controller,
      health.etcd,
      health.scheduler,
      health.cloudProviderInfrastructure,
      health.userClusterControllerManager,
    ];
    if (provider !== Provider.Edge) {
      supported.push(health.machineController);
    }

    return supported.every(status => HealthState.isUp(status));
  }
}

export enum HealthState {
  Down = 'HealthStatusDown',
  Up = 'HealthStatusUp',
  Provisioning = 'HealthStatusProvisioning',
}

export enum HealthType {
  Apiserver = 'apiserver',
  Controller = 'controller',
  Etcd = 'etcd',
  MachineController = 'machineController',
  Scheduler = 'scheduler',
  CloudProviderInfrastructure = 'cloudProviderInfrastructure',
  UserClusterControllerManager = 'userClusterControllerManager',
  GatekeeperAudit = 'gatekeeperAudit',
  GatekeeperController = 'gatekeeperController',
  MlaGateway = 'mlaGateway',
  AlertmanagerConfig = 'alertmanagerConfig',
  Logging = 'logging',
  Monitoring = 'monitoring',
  KubernetesDashboard = 'kubernetesDashboard',
  OperatingSystemManager = 'operatingSystemManager',
}

export namespace HealthState {
  export function isUp(state: HealthState): boolean {
    return HealthState.Up === state;
  }

  export function isDown(state: HealthState): boolean {
    return HealthState.Down === state;
  }

  export function isProvisioning(state: HealthState): boolean {
    return HealthState.Provisioning === state;
  }
}
