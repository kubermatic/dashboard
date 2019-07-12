import {HealthEntity, HealthState} from '../../shared/entity/HealthEntity';

export function fakeHealth(): HealthEntity {
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

export function fakeHealthProvisioning(): HealthEntity {
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

export function fakeHealthFailed(): HealthEntity {
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
