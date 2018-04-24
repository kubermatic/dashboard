import { Injectable } from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';

@Injectable()
export class ClusterService {

  getClusterHealthStatus (cluster: ClusterEntity): string {
    const waiting = 'statusWaiting';
    const running = 'statusRunning';
    const deleting = 'statusDeleting';

    if (!!cluster.status.health) {
      if (cluster.metadata.deletionTimestamp) {
        return deleting;
      } else if (cluster.status.health.apiserver && cluster.status.health.scheduler && cluster.status.health.controller && cluster.status.health.machineController && cluster.status.health.etcd) {
        return running;
      }
    }
    return waiting;
  }

  isClusterRunning(cluster: ClusterEntity): boolean {
    if (cluster.metadata.deletionTimestamp) {
      return false;
    } else if (!!cluster.status.health && cluster.status.health.apiserver) {
      return true;
    }
    return false;
  }
}
