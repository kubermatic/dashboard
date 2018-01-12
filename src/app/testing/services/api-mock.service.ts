import { ClusterEntity } from './../../shared/entity/ClusterEntity';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ApiMockService {
    public getCluster(cluster: string): Observable<ClusterEntity> {
        return Observable.of();
    }
}

