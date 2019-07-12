export class HealthEntity {
  apiserver: HealthState;
  controller: HealthState;
  etcd: HealthState;
  machineController: HealthState;
  scheduler: HealthState;
  cloudProviderInfrastructure: HealthState;
  userClusterControllerManager: HealthState;

  static allHealthy(health: HealthEntity): boolean {
    return Object.values(health).every(status => HealthState.isUp(status));
  }
}

export enum HealthState {
  down = 0,
  up = 1,
  provisioning = 2,
}

export namespace HealthState {
  export function isUp(state: HealthState): boolean {
    return HealthState.up === state;
  }

  export function isDown(state: HealthState): boolean {
    return HealthState.down === state;
  }

  export function isProvisioning(state: HealthState): boolean {
    return HealthState.provisioning === state;
  }
}
