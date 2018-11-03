import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { Auth } from '../auth/auth.service';
import { environment } from './../../../../environments/environment';

@Injectable()
export class DatacenterService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  private dataCenterCache: Observable<DataCenterEntity[]>;

  constructor(private http: HttpClient,
              private auth: Auth) {
    const token = this.auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + token);
  }

  getDataCenters(): Observable<DataCenterEntity[]> {
    const url = `${this.restRoot}/dc`;
    if (!this.dataCenterCache) {
      this.dataCenterCache = this.http.get<DataCenterEntity[]>(url, { headers: this.headers }).pipe(
        publishReplay(1),
        refCount());
    }
    return this.dataCenterCache;
  }

  getDataCenter(name: string): Observable<DataCenterEntity> {
    return this.getDataCenters().pipe(map((res) => {
      for (const i in res) {
        if (res[i].metadata.name === name) {
          return res[i];
        }
      }
      return null;
    }));
  }

  getSeedDataCenters(): Observable<DataCenterEntity[]> {
    const datacenters: DataCenterEntity[] = [];
    return this.getDataCenters().pipe(map((res) => {
      for (const i in res) {
        if (res[i].seed === true) {
          datacenters.push(res[i]);
        }
      }
      return datacenters;
    }));
  }
}
