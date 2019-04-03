import {HealthEntity} from '../../shared/entity/HealthEntity';

export function fakeHealth(): HealthEntity {
  return {
    apiserver: true,
    controller: true,
    etcd: true,
    machineController: true,
    scheduler: true,
    cloudProviderInfrastructure: true,
    userClusterControllerManager: true,
  };
}

export function fakeHealthProvisioning(): HealthEntity {
  return {
    apiserver: true,
    controller: true,
    etcd: false,
    machineController: true,
    scheduler: false,
    cloudProviderInfrastructure: false,
    userClusterControllerManager: false,
  };
}

export function fakeHealthFailed(): HealthEntity {
  return {
    apiserver: false,
    controller: false,
    etcd: false,
    machineController: false,
    scheduler: false,
    cloudProviderInfrastructure: false,
    userClusterControllerManager: false,
  };
}
