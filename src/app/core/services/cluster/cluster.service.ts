import { Injectable } from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';

@Injectable()
export class ClusterService {

  constructor() { }
  public validateClusterPhase (cluster: ClusterEntity): string {

      if (!cluster.status || !cluster.status.phase) {
        return 'Waiting';
      }

      if (cluster.metadata.deletionTimestamp) {
        return 'Deleting';
      }

      if (cluster.status.health.apiserver && cluster.status.health.scheduler && cluster.status.health.controller && cluster.status.health.nodeController && cluster.status.health.etcd) {
        return 'Running';
      }

      return cluster.status.phase;
  }

}
