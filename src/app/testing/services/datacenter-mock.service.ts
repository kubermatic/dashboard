import { datacentersFake, seedDatacentersFake } from './../fake-data/datacenter.fake';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { find } from 'lodash';

@Injectable()
export class DatacenterMockService {
  private datacenters: DataCenterEntity[] = datacentersFake;
  private seedDatacenters: string[] = seedDatacentersFake;

  public getDataCenters(cluster: string): Observable<DataCenterEntity[]> {
    return Observable.of(this.datacenters);
  }

  public getDataCenter(dcName: string): Observable<DataCenterEntity> {
    const dc = find(this.datacenters, ['metadata.name', dcName]);
    return Observable.of(dc);
  }

  public getSeedDataCenters(): Observable<string[]> {
    return Observable.of(this.seedDatacenters);
  }
}

