// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {AdminSeed, CreateDatacenterModel, Datacenter, SeedOverview, SeedSettings} from '@shared/entity/datacenter';
import _ from 'lodash';
import {iif, merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, map, retry, shareReplay, switchMap, take} from 'rxjs/operators';
import {Auth} from './auth/service';

@Injectable()
export class DatacenterService {
  private readonly _refreshTime = 60;
  private readonly _retryTime = 5;
  private readonly _maxRetries = 5;
  private _restRoot: string = environment.restRoot;
  private _newRestRoot: string = environment.newRestRoot;
  private _datacenters$: Observable<Datacenter[]>;
  private _datacentersRefresh$ = new Subject<void>();
  private _seeds$: Observable<string[]>;
  private _seedSettings$ = new Map<string, Observable<SeedSettings>>();
  private _seedSettingsRefresh$ = new Subject<void>();
  private _seedsRefresh$ = new Subject<void>();
  private _adminSeeds$: Observable<AdminSeed[]>;
  private _adminSeedsRefresh$ = new Subject<void>();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _auth: Auth,
    private readonly _appConfigService: AppConfigService
  ) {}

  init(): void {
    this._datacenters$ = merge(this._datacentersRefresh$, this._refreshTimer$)
      .pipe(switchMap(() => iif(() => this._auth.authenticated(), this._getDatacenters(), of([]))))
      .pipe(map(datacenters => _.sortBy(datacenters, d => d.metadata.name.toLowerCase())))
      .pipe(retry({delay: this._retryTime * this._appConfigService.getRefreshTimeBase(), count: this._maxRetries}))
      .pipe(shareReplay(1));
    this._datacenters$.pipe(take(1)).subscribe(_ => {});

    this._seeds$ = merge(this._seedsRefresh$, this._refreshTimer$)
      .pipe(switchMap(() => iif(() => this._auth.authenticated(), this._getSeeds(), of([]))))
      .pipe(map((seeds: string[]) => _.sortBy(seeds, s => s.toLowerCase())))
      .pipe(retry({delay: this._retryTime * this._appConfigService.getRefreshTimeBase(), count: this._maxRetries}))
      .pipe(shareReplay(1));
    this._seeds$.pipe(take(1)).subscribe(_ => {});
  }

  get datacenters(): Observable<Datacenter[]> {
    return this._datacenters$;
  }

  private _getDatacenters(): Observable<Datacenter[]> {
    const url = `${this._restRoot}/dc`;
    return this._httpClient.get<Datacenter[]>(url).pipe(catchError(() => of<Datacenter[]>([])));
  }

  refreshDatacenters(): void {
    this._datacentersRefresh$.next();
  }

  getDatacenter(name: string): Observable<Datacenter> {
    return this.datacenters.pipe(map(datacenters => datacenters.find(dc => dc.metadata.name === name)));
  }

  createDatacenter(model: CreateDatacenterModel): Observable<Datacenter> {
    const url = `${this._restRoot}/seed/${model.spec.seed}/dc`;
    return this._httpClient.post<Datacenter>(url, model);
  }

  patchDatacenter(seed: string, dc: string, patch: Datacenter): Observable<Datacenter> {
    const url = `${this._restRoot}/seed/${seed}/dc/${dc}`;
    return this._httpClient.patch<Datacenter>(url, patch);
  }

  deleteDatacenter(datacenter: Datacenter): Observable<void> {
    const url = `${this._restRoot}/seed/${datacenter.spec.seed}/dc/${datacenter.metadata.name}`;
    return this._httpClient.delete<void>(url);
  }

  get seeds(): Observable<string[]> {
    return this._seeds$;
  }

  private _getSeeds(): Observable<string[]> {
    const url = `${this._restRoot}/seed`;
    return this._httpClient.get<string[]>(url);
  }

  seedSettings(seedName: string): Observable<SeedSettings> {
    if (!this._seedSettings$.get(seedName)) {
      const _seedSettings$ = merge(this._seedSettingsRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getSeedSettings(seedName)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));

      this._seedSettings$.set(seedName, _seedSettings$);
    }

    return this._seedSettings$.get(seedName);
  }

  refreshSeedSettings(): void {
    this._seedSettingsRefresh$.next();
  }

  getSeedOverview(seedName: string): Observable<SeedOverview> {
    const url = `${this._newRestRoot}/seeds/${seedName}/overview`;
    return this._httpClient.get<SeedOverview>(url).pipe(catchError(() => of<SeedOverview>({} as SeedOverview)));
  }

  private _getSeedSettings(seedName: string): Observable<SeedSettings> {
    const url = `${this._newRestRoot}/seeds/${seedName}/settings`;
    return this._httpClient.get<SeedSettings>(url).pipe(catchError(() => of<SeedSettings>({} as SeedSettings)));
  }

  // only admins can call following endpoints
  get adminSeeds(): Observable<AdminSeed[]> {
    if (!this._adminSeeds$) {
      this._adminSeeds$ = merge(this._adminSeedsRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getAdminSeeds()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._adminSeeds$;
  }

  private _getAdminSeeds(): Observable<AdminSeed[]> {
    const url = `${this._restRoot}/admin/seeds`;
    return this._httpClient.get<AdminSeed[]>(url).pipe(catchError(() => of<AdminSeed[]>([])));
  }

  refreshAdminSeeds(): void {
    this._adminSeedsRefresh$.next();
  }

  patchAdminSeed(seedName: string, patch: AdminSeed): Observable<AdminSeed> {
    const url = `${this._restRoot}/admin/seeds/${seedName}`;
    return this._httpClient.patch<AdminSeed>(url, patch);
  }
}
