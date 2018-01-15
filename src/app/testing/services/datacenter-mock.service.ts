import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { find } from 'lodash';

@Injectable()
export class DatacenterMockService {
    private datacenters: DataCenterEntity[] = [
        {
            metadata: {
                name: 'do-fra1',
                selfLink: '',
                uid: '',
                creationTimestamp: new Date(),
                labels: new Map(),
                annotations: new Map()
            },
            seed: undefined,
            spec: {
                country: 'DE',
                digitalocean: {
                    region: 'fra1'
                },
                bringyourown: undefined,
                openstack: undefined,
                aws: undefined,
                location: 'Frankfurt',
                provider: 'digitalocean'
            }
        },
        {
            metadata: {
                name: 'europe-west3-c',
                selfLink: '',
                uid: '',
                creationTimestamp: new Date(),
                labels: new Map(),
                annotations: new Map()
            },
            seed: true,
            spec: {
                country: 'DE',
                digitalocean: undefined,
                bringyourown: undefined,
                openstack: undefined,
                aws: undefined,
                location: 'Frankfurt',
                provider: 'bringyourown'
            }
        }
    ];

    public getDataCenters(cluster: string): Observable<DataCenterEntity[]> {
        return Observable.of(this.datacenters);
    }

    public getDataCenter(dcName: string): Observable<DataCenterEntity> {
        const dc = find(this.datacenters, ['metadata.name', dcName]);
        return Observable.of(dc);
    }
}

