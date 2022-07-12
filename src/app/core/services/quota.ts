// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injectable, OnDestroy} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, merge, timer, Subject} from 'rxjs';
import {switchMap, shareReplay, map, takeUntil} from 'rxjs/operators';
import {environment} from '@environments/environment';
import {QuotaDetails, Quota, QuotaVariables} from '@shared/entity/quota';
import {AppConfigService} from '../../config.service';

@Injectable()
export class QuotaService implements OnDestroy {
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
        shareReplay({refCount: true, bufferSize: 1}),
        takeUntil(this._unsubscribe)
      );
    }

    return this._quotas$;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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

  private _getQuotas(): Observable<QuotaDetails[]> {
    return this._http
      .get<QuotaDetails[]>(this._baseUrl)
      .pipe(map(quota => quota.sort((a, b) => (a.name < b.name ? -1 : 1))));
  }
}
