import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {merge, Observable, Subject} from 'rxjs';
import {debounceTime, filter, shareReplay, switchMap, tap} from 'rxjs/operators';
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
  private _quotaExceeded$ = new Subject<boolean>();

  constructor(private readonly _http: HttpClient) {}

  get quotaPayload(): ProjectResourceQuotaPayload {
    return this._quotaPayload;
  }

  set quotaPayload(value: ProjectResourceQuotaPayload) {
    this._quotaPayload = value;
  }

  getQuotaExceededObservable$(): Observable<boolean> {
    return this._quotaExceeded$.asObservable();
  }

  onQuotaExceeded(isExceeded: boolean): void {
    this._quotaExceeded$.next(isExceeded);
  }

  refreshQuotaCalculations() {
    this._refreshQuotaCalculation$.next();
  }

  reset(key: string): void {
    this.quotaPayload = null;
    this.onQuotaExceeded(false);
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
        .pipe(tap((quota: ResourceQuotaUpdateCalculation) => this.onQuotaExceeded(!!quota.message ?? false)))
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
}
