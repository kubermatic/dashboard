import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import _ from 'lodash';
import {merge, Observable, Subject} from 'rxjs';
import {debounceTime, filter, shareReplay, switchMap} from 'rxjs/operators';
import {ResourceQuotaCalculationPayload, ResourceQuotaCalculation} from '@shared/entity/quota';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QuotaCalculationService {
  private readonly _debounceTime = 500;
  private readonly _newRestRoot: string = environment.newRestRoot;
  private _quotaExceeded$ = new Subject<boolean>();
  private _refresh$ = new Subject<void>();
  private _requestMap = new Map<string, Observable<ResourceQuotaCalculation>>();
  private _quotaPayload: ResourceQuotaCalculationPayload;

  constructor(private readonly _http: HttpClient) {}

  get quotaPayload(): ResourceQuotaCalculationPayload {
    return this._quotaPayload;
  }

  set quotaPayload(value: ResourceQuotaCalculationPayload) {
    this._quotaPayload = value;
  }

  refreshQuotaExceed(isQuotaExceeded: boolean) {
    this._quotaExceeded$.next(isQuotaExceeded);
  }

  getQuotaExceed(): Observable<boolean> {
    return this._quotaExceeded$.asObservable();
  }

  refreshQuotaCalculations(newQuotaPayload: ResourceQuotaCalculationPayload) {
    if (!_.isEqual(newQuotaPayload, this.quotaPayload)) {
      this._quotaPayload = newQuotaPayload;
      this._refresh$.next();
    }
  }

  reset(key: string): void {
    this.quotaPayload = null;
    if (this._requestMap.has(key)) {
      this._requestMap.delete(key);
    }
  }

  getQuotaCalculations(projectID: string, provider: string): Observable<ResourceQuotaCalculation> {
    const mapKey = `${projectID}-${provider}`;
    if (!this._requestMap.has(mapKey)) {
      const request$ = merge(this._refresh$)
        .pipe(debounceTime(this._debounceTime))
        .pipe(filter(() => this.quotaPayload !== null))
        .pipe(switchMap(_ => this.quotaCalculation(projectID, this.quotaPayload)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
      this._requestMap.set(mapKey, request$);
    }

    return this._requestMap.get(mapKey);
  }

  quotaCalculation(projectID: string, payload: ResourceQuotaCalculationPayload): Observable<ResourceQuotaCalculation> {
    const url = `${this._newRestRoot}/projects/${projectID}/quotacalculation`;
    return this._http.post<ResourceQuotaCalculation>(url, payload);
  }
}
