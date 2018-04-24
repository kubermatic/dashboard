import { Injectable } from '@angular/core';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ClusterHealth } from '../../../shared/model/ClusterHealthConstants';

@Injectable()
export class ClusterService {

  getClusterHealthStatus (cluster: ClusterEntity): string {
    if (!!cluster.status.health) {
      if (cluster.metadata.deletionTimestamp) {
        return ClusterHealth.DELETING;
      } else if (cluster.status.health.apiserver && cluster.status.health.scheduler && cluster.status.health.controller && cluster.status.health.machineController && cluster.status.health.etcd) {
        return ClusterHealth.RUNNING;
      }
    }
    return ClusterHealth.WAITING;
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
