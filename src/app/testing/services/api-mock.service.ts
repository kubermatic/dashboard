import { clusterFake, clustersFake } from './../fake-data/cluster.fake';
import { ClusterEntity } from './../../shared/entity/ClusterEntity';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ApiMockService {
    private cluster: ClusterEntity = clusterFake;
    private clusters: ClusterEntity[] = clustersFake;

    public getCluster(clusterId: string): Observable<ClusterEntity> {
        return Observable.of(this.cluster);
    }

    public getClusters(): Observable<ClusterEntity[]> {
        return Observable.of(this.clusters);
    }
}

