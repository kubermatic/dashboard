import {HealthEntity, HealthStatus} from '../../shared/entity/HealthEntity';

export function fakeHealth(): HealthEntity {
  return {
    apiserver: HealthStatus.up,
    controller: HealthStatus.up,
    etcd: HealthStatus.up,
    machineController: HealthStatus.up,
    scheduler: HealthStatus.up,
    cloudProviderInfrastructure: HealthStatus.up,
    userClusterControllerManager: HealthStatus.up,
  };
}

export function fakeHealthProvisioning(): HealthEntity {
  return {
    apiserver: HealthStatus.up,
    controller: HealthStatus.up,
    etcd: HealthStatus.down,
    machineController: HealthStatus.up,
    scheduler: HealthStatus.down,
    cloudProviderInfrastructure: HealthStatus.down,
    userClusterControllerManager: HealthStatus.down,
  };
}

export function fakeHealthFailed(): HealthEntity {
  return {
    apiserver: HealthStatus.down,
    controller: HealthStatus.down,
    etcd: HealthStatus.down,
    machineController: HealthStatus.down,
    scheduler: HealthStatus.down,
    cloudProviderInfrastructure: HealthStatus.down,
    userClusterControllerManager: HealthStatus.down,
  };
}
