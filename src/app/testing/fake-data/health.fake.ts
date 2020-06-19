import {Health, HealthState} from '../../shared/entity/health';

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
