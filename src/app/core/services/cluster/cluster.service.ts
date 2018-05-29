import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ClusterHealth } from '../../../shared/model/ClusterHealthConstants';
import { ClusterProviderSettingsData } from '../../../shared/model/ClusterSpecChange';

@Injectable()
export class ClusterService {
  private _providerSettingsData = new Subject<ClusterProviderSettingsData>();
  providerSettingsDataChanges$ = this._providerSettingsData.asObservable();

  changeProviderSettingsData(data: ClusterProviderSettingsData) {
    this._providerSettingsData.next(data);
  }

  getClusterHealthStatus (cluster: ClusterEntity): string {
    if (!!cluster.status.health) {
      if (cluster.metadata.deletionTimestamp) {
        return ClusterHealth.DELETING;
      } else if (cluster.status.health.apiserver && cluster.status.health.scheduler && cluster.status.health.controller && cluster.status.health.machineController && cluster.status.health.etcd) {
        if (cluster.spec.pause) {
          return ClusterHealth.ACTIONREQUIRED;
        } else {
          return ClusterHealth.RUNNING;
        }
      } else if (cluster.spec.pause) {
        return ClusterHealth.ACTIONREQUIRED;
      }
    }
    return ClusterHealth.WAITING;
  }

  isClusterRunning(cluster: ClusterEntity): boolean {
    if (cluster.metadata.deletionTimestamp) {
      return false;
    } else if (!!cluster.status.health && cluster.status.health.apiserver) {
      if (cluster.spec.pause) {
        return false;
      } else {
        return true;
      }
    } else if (cluster.spec.pause) {
      return false;
    }
    return false;
  }
}
