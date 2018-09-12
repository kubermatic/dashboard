import { fakeBringyourownSeedDatacenter, fakeNodeDatacenters } from './../fake-data/datacenter.fake';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { find } from 'lodash';

@Injectable()
export class DatacenterMockService {
  private datacenters: DataCenterEntity[] = fakeNodeDatacenters();
  private seedDatacenters: DataCenterEntity[] = [fakeBringyourownSeedDatacenter()];

  public getDataCenters(cluster: string): Observable<DataCenterEntity[]> {
    return of(this.datacenters);
  }

  public getDataCenter(dcName: string): Observable<DataCenterEntity> {
    const dc = find(this.datacenters, ['metadata.name', dcName]);
    return of(dc);
  }

  public getSeedDataCenters(): Observable<DataCenterEntity[]> {
    return of(this.seedDatacenters);
  }
}

