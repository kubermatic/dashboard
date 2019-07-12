export class HealthEntity {
  apiserver: HealthStatus;
  controller: HealthStatus;
  etcd: HealthStatus;
  machineController: HealthStatus;
  scheduler: HealthStatus;
  cloudProviderInfrastructure: HealthStatus;
  userClusterControllerManager: HealthStatus;

  static allHealthy(health: HealthEntity): boolean {
    return Object.values(health).every(status => status === HealthStatus.up);
  }
}

export enum HealthStatus {
  down = 0,
  up = 1,
  provisioning = 2
}
