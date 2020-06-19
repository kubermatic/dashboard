import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {shareReplay} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {ResourceLabelMap} from '../../../shared/entity/common';

@Injectable()
export class LabelService {
  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  private systemLabelsCache: Observable<ResourceLabelMap>;

  constructor(private readonly _http: HttpClient) {}

  get systemLabels(): Observable<ResourceLabelMap> {
    const url = `${this.restRoot}/labels/system`;
    if (!this.systemLabelsCache) {
      this.systemLabelsCache = this._http
        .get<ResourceLabelMap>(url, {headers: this.headers})
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this.systemLabelsCache;
  }
}
