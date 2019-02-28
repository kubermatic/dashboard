export class HealthEntity {
  apiserver: boolean;
  controller: boolean;
  etcd: boolean;
  machineController: boolean;
  scheduler: boolean;
  cloudProviderInfrastructure: boolean;
}

export function allHealthy(health: HealthEntity): boolean {
  if (health && !!health.apiserver && !!health.controller && !!health.etcd && !!health.machineController &&
      !!health.scheduler && !!health.cloudProviderInfrastructure) {
    return true;
  } else {
    return false;
  }
}
