import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { HealthEntity } from '../../../shared/entity/HealthEntity';
import { ClusterHealth } from '../../../shared/model/ClusterHealthConstants';
import { Auth } from '../auth/auth.service';
import { environment } from './../../../../environments/environment';

@Injectable()
export class HealthService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  constructor(private http: HttpClient,
              private auth: Auth) {
    const token = this.auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + token);
  }

  getClusterHealth(cluster: string, dc: string, projectID: string): Observable<HealthEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/health`;
    return this.http.get<HealthEntity>(url, { headers: this.headers });
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
