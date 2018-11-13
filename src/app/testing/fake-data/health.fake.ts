import {HealthEntity} from '../../shared/entity/HealthEntity';

export function fakeHealth(): HealthEntity {
  return {
    apiserver: true,
    controller: true,
    etcd: true,
    machineController: true,
    scheduler: true,
  };
}
