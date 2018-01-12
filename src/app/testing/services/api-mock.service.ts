import { ClusterEntity } from './../../shared/entity/ClusterEntity';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ApiMockService {
    // private cluster: ClusterEntity = {
    // }

    public getCluster(cluster: string): Observable<ClusterEntity> {
        return Observable.of();
    }
}

