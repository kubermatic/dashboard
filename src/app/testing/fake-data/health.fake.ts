import { HealthEntity } from '../../shared/entity/HealthEntity';

export const fakeHealth: HealthEntity = {
  apiserver: true,
  controller: true,
  etcd: true,
  machineController: true,
  scheduler: true
};
