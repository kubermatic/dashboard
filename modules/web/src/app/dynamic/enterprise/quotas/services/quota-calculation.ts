import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import _ from 'lodash';
import {merge, Observable, Subject} from 'rxjs';
import {debounceTime, filter, shareReplay, switchMap} from 'rxjs/operators';
import {ProjectResourceQuotaPayload, ResourceQuotaUpdateCalculation} from '@shared/entity/quota';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QuotaCalculationService {
  private readonly _debounceTime = 500;
  private readonly _newRestRoot: string = environment.newRestRoot;
  private _refreshQuotaCalculation$ = new Subject<void>();
  private _resourceQuotaUpdateCalculationMap = new Map<string, Observable<ResourceQuotaUpdateCalculation>>();
  private _quotaPayload: ProjectResourceQuotaPayload;

  constructor(private readonly _http: HttpClient) {}

  get quotaPayload(): ProjectResourceQuotaPayload {
    return this._quotaPayload;
  }

  set quotaPayload(value: ProjectResourceQuotaPayload) {
    this._quotaPayload = value;
  }

  refreshQuotaCalculations(newQuotaPayload: ProjectResourceQuotaPayload) {
    if (!_.isEqual(newQuotaPayload, this.quotaPayload)) {
      this._applySettings(newQuotaPayload);
      this._refreshQuotaCalculation$.next();
    }
  }

  reset(key: string): void {
    this.quotaPayload = null;
    if (this._resourceQuotaUpdateCalculationMap.has(key)) {
      this._resourceQuotaUpdateCalculationMap.delete(key);
    }
  }

  getQuotaCalculations(projectID: string, provider: string): Observable<ResourceQuotaUpdateCalculation> {
    const mapKey = `${projectID}-${provider}`;
    if (!this._resourceQuotaUpdateCalculationMap.has(mapKey)) {
      const request$ = merge(this._refreshQuotaCalculation$)
        .pipe(debounceTime(this._debounceTime))
        .pipe(filter(() => this.quotaPayload !== null))
        .pipe(switchMap(_ => this.quotaCalculation(projectID, this.quotaPayload)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
      this._resourceQuotaUpdateCalculationMap.set(mapKey, request$);
    }

    return this._resourceQuotaUpdateCalculationMap.get(mapKey);
  }

  quotaCalculation(
    projectID: string,
    payload: ProjectResourceQuotaPayload
  ): Observable<ResourceQuotaUpdateCalculation> {
    const url = `${this._newRestRoot}/projects/${projectID}/quotacalculation`;
    return this._http.post<ResourceQuotaUpdateCalculation>(url, payload);
  }

  private _applySettings(payload: ProjectResourceQuotaPayload): void {
    this._quotaPayload = payload;
  }
}
