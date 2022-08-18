//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Quota, QuotaDetails, QuotaVariables} from '@shared/entity/quota';
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, map, shareReplay, switchMap, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '@app/config.service';

@Injectable()
export class QuotaService {
  private _unsubscribe = new Subject<void>();

  constructor(private _http: HttpClient, private readonly _appConfigService: AppConfigService) {}

  private _quotas$: Observable<QuotaDetails[]>;
  private _quotasRefresh$ = new Subject<void>();

  private readonly _refreshTime = 5;
  private readonly _newRestRoot = environment.newRestRoot;
  private readonly _baseUrl = this._newRestRoot + '/quotas';
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  get quotas(): Observable<QuotaDetails[]> {
    if (!this._quotas$) {
      this._quotas$ = merge(this._refreshTimer$, this._quotasRefresh$).pipe(
        switchMap(() => this._getQuotas()),
        shareReplay({refCount: true, bufferSize: 1})
      );
    }

    return this._quotas$;
  }

  refreshQuotas(): void {
    this._quotasRefresh$.next();
  }

  createQuota(payload: Quota): Observable<Record<string, never>> {
    return this._http.post<Record<string, never>>(this._baseUrl, payload);
  }

  updateQuota(quotaName: string, payload: QuotaVariables): Observable<Record<string, never>> {
    return this._http.patch<Record<string, never>>(this._baseUrl + '/' + quotaName, payload);
  }

  deleteQuota(quotaName: string): Observable<Record<string, never>> {
    return this._http.delete<Record<string, never>>(this._baseUrl + '/' + quotaName);
  }

  getProjectQuota(projectId: string): Observable<QuotaDetails> {
    return this._refreshTimer$.pipe(
      switchMap(_ =>
        this._http.get<QuotaDetails>(`${this._newRestRoot}/projects/${projectId}/quota`).pipe(catchError(_ => of(null)))
      ),
      shareReplay({refCount: true, bufferSize: 1}),
      takeUntil(this._unsubscribe)
    );
  }

  private _getQuotas(): Observable<QuotaDetails[]> {
    return this._http
      .get<QuotaDetails[]>(this._baseUrl)
      .pipe(map(quota => quota.sort((a, b) => (a.name < b.name ? -1 : 1))));
  }
}
