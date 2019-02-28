export class HealthEntity {
  apiserver: boolean;
  controller: boolean;
  etcd: boolean;
  machineController: boolean;
  scheduler: boolean;
  cloudProviderInfrastructure: boolean;

  static allHealthy(health: HealthEntity): boolean {
    return (
        health && !!health.apiserver && !!health.controller && !!health.etcd && !!health.machineController &&
        !!health.scheduler && !!health.cloudProviderInfrastructure);
  }
}
