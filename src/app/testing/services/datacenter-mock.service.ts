import {Injectable} from '@angular/core';
import {find} from 'lodash';
import {Observable, of} from 'rxjs';
import {Datacenter} from '../../shared/entity/datacenter';
import {fakeNodeDatacenters} from '../fake-data/datacenter.fake';

@Injectable()
export class DatacenterMockService {
  get datacenters(): Observable<Datacenter[]> {
    return of(fakeNodeDatacenters());
  }

  getDatacenter(dcName: string): Observable<Datacenter> {
    const dc = find(fakeNodeDatacenters(), ['metadata.name', dcName]);
    return of(dc);
  }
}
