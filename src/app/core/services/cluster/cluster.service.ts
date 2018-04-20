import { Injectable } from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';

@Injectable()
export class ClusterService {

  getClusterHealthStatus (cluster: ClusterEntity): string {
    if (!!cluster.status.health) {
      if (cluster.metadata.deletionTimestamp) {
        return 'statusDeleting';
      } else if (cluster.status.health.apiserver && cluster.status.health.scheduler && cluster.status.health.controller && cluster.status.health.machineController && cluster.status.health.etcd) {
        return 'statusRunning';
      } else if (!cluster.status.health.apiserver) {
        return 'statusFailed';
      }
      return 'statusWaiting';
    }
    return 'statusWaiting';
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
