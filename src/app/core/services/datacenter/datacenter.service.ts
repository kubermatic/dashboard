import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../environments/environment';
import { Auth } from '../auth/auth.service';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';

@Injectable()
export class DatacenterService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  private dataCenterCache: Observable<DataCenterEntity[]>;

  constructor(private http: HttpClient,
              private auth: Auth) {
    const token = auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + token);
  }

  getDataCenters(): Observable<DataCenterEntity[]> {
    const url = `${this.restRoot}/dc`;
    if  (!this.dataCenterCache) {
      this.dataCenterCache =  this.http.get<DataCenterEntity[]>(url, { headers: this.headers })
        .publishReplay(1)
        .refCount();
    }
    return this.dataCenterCache;
  }

  getDataCenter(dc: string): Observable<DataCenterEntity> {
    const url = `${this.restRoot}/dc/${dc}`;
    return this.http.get<DataCenterEntity>(url, { headers: this.headers });
  }

}
