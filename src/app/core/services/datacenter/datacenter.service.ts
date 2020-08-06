// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {iif, merge, Observable, of, Subject, timer} from 'rxjs';
import {first, map, shareReplay, switchMap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {CreateDatacenterModel, Datacenter} from '../../../shared/entity/datacenter';
import {AppConfigService} from '../../../app-config.service';
import {Auth} from '../auth/auth.service';

@Injectable()
export class DatacenterService {
  private readonly _refreshTime = 60;
  private _restRoot: string = environment.restRoot;
  private _datacenters$: Observable<Datacenter[]>;
  private _datacentersRefresh$ = new Subject();
  private _seeds$: Observable<string[]>;
  private _seedsRefresh$ = new Subject();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _auth: Auth,
    private readonly _appConfigService: AppConfigService
  ) {}

  init(): void {
    this._datacenters$ = merge(this._datacentersRefresh$, this._refreshTimer$)
      .pipe(switchMap(() => iif(() => this._auth.authenticated(), this._getDatacenters(), of([]))))
      .pipe(
        map((datacenters: Datacenter[]) => datacenters.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)))
      )
      .pipe(shareReplay(1));
    this._datacenters$.pipe(first()).subscribe(_ => {});

    this._seeds$ = merge(this._seedsRefresh$, this._refreshTimer$)
      .pipe(switchMap(() => iif(() => this._auth.authenticated(), this._getSeeds(), of([]))))
      .pipe(map((seeds: string[]) => seeds.sort((a, b) => a.localeCompare(b))))
      .pipe(shareReplay(1));
    this._seeds$.pipe(first()).subscribe(_ => {});
  }

  get datacenters(): Observable<Datacenter[]> {
    return this._datacenters$;
  }

  private _getDatacenters(): Observable<Datacenter[]> {
    const url = `${this._restRoot}/dc`;
    return this._httpClient.get<Datacenter[]>(url);
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

  deleteDatacenter(datacenter: Datacenter): Observable<any> {
    const url = `${this._restRoot}/seed/${datacenter.spec.seed}/dc/${datacenter.metadata.name}`;
    return this._httpClient.delete(url);
  }

  get seeds(): Observable<string[]> {
    return this._seeds$;
  }

  private _getSeeds(): Observable<string[]> {
    const url = `${this._restRoot}/seed`;
    return this._httpClient.get<string[]>(url);
  }
}
