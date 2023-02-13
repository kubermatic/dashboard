import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import _ from 'lodash';
import {merge, Observable, Subject} from 'rxjs';
import {debounceTime, filter, shareReplay, startWith, switchMap, tap} from 'rxjs/operators';
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
  private _calculationInProgress = new Subject<boolean>();

  constructor(private readonly _http: HttpClient) {}

  get quotaPayload(): ResourceQuotaCalculationPayload {
    return this._quotaPayload;
  }

  set quotaPayload(value: ResourceQuotaCalculationPayload) {
    this._quotaPayload = value;
  }

  get calculationInProgress(): Observable<boolean> {
    return this._calculationInProgress.asObservable();
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
        .pipe(tap(_ => this._calculationInProgress.next(true)))
        .pipe(debounceTime(this._debounceTime))
        .pipe(startWith(this.quotaPayload))
        .pipe(filter(() => !!this.quotaPayload))
        .pipe(switchMap(_ => this.quotaCalculation(projectID, this.quotaPayload)))
        .pipe(tap(_ => this._calculationInProgress.next(false)))
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
