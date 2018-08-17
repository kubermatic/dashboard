import { fakeHealth } from './../fake-data/health.fake';
import { HealthEntity } from './../../shared/entity/HealthEntity';
import { ClusterEntity } from './../../shared/entity/ClusterEntity';
import { ClusterHealth } from './../../shared/model/ClusterHealthConstants';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { find } from 'lodash';

@Injectable()
export class HealthMockService {
  private health: HealthEntity = fakeHealth;

  public getClusterHealth(cluster: string, dc: string, projectID: string): Observable<HealthEntity> {
    return Observable.of(this.health);
  }

  getClusterHealthStatus(cluster: ClusterEntity, health: HealthEntity): string {
    if (!!cluster && !!health) {
      if (cluster.deletionTimestamp) {
        return ClusterHealth.DELETING;
      } else if (health.apiserver && health.scheduler && health.controller && health.machineController && health.etcd) {
        return ClusterHealth.RUNNING;
      }
    }
    return ClusterHealth.WAITING;
  }

  isClusterRunning(cluster: ClusterEntity, health: HealthEntity): boolean {
    if (!!cluster.deletionTimestamp) {
      return false;
    } else if (health && health.apiserver) {
      return true;
    }
    return false;
  }
}
