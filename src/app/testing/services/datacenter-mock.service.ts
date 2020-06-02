import {Injectable} from '@angular/core';
import {find} from 'lodash';
import {Observable, of} from 'rxjs';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {fakeBringyourownSeedDatacenter, fakeNodeDatacenters} from '../fake-data/datacenter.fake';

@Injectable()
export class DatacenterMockService {
  private seedDatacenters: DataCenterEntity[] = [fakeBringyourownSeedDatacenter()];

  get datacenters(): Observable<DataCenterEntity[]> {
    return of(fakeNodeDatacenters());
  }

  getDatacenter(dcName: string): Observable<DataCenterEntity> {
    const dc = find(fakeNodeDatacenters(), ['metadata.name', dcName]);
    return of(dc);
  }

  getSeedDataCenters(): Observable<DataCenterEntity[]> {
    return of(this.seedDatacenters);
  }
}
