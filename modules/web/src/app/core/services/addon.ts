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
import {environment} from '@environments/environment';
import {Observable, of, timer} from 'rxjs';
import {Addon, AddonConfig} from '@shared/entity/addon';
import {catchError, shareReplay, switchMap} from 'rxjs/operators';
import {AppConfigService} from '@app/config.service';

@Injectable()
export class AddonService {
  private readonly _restRoot: string = environment.restRoot;
  private readonly _newRestRoot: string = environment.newRestRoot;
  private readonly _refreshTime = 30;
  private readonly _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _addonConfigs$: Observable<AddonConfig[]>;

  constructor(
    private readonly _appConfigService: AppConfigService,
    private readonly _httpClient: HttpClient
  ) {}

  /**
   * Adds addon into a cluster.
   *
   * @param addon     addon
   * @param projectID ID of a project
   * @param clusterID ID of a cluster
   */
  add(addon: Addon, projectID: string, clusterID: string): Observable<Addon> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/addons`;
    return this._httpClient.post<Addon>(url, addon);
  }

  /**
   * Lists addons deployed in a cluster.
   *
   * @param projectID ID of a project
   * @param clusterID ID of a cluster
   */
  list(projectID: string, clusterID: string): Observable<Addon[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/addons`;
    return this._httpClient.get<Addon[]>(url).pipe(catchError(() => of<Addon[]>([])));
  }

  /**
   * Patches addon in a cluster.
   *
   * @param addon     addon
   * @param projectID ID of a project
   * @param clusterID ID of a cluster
   */
  patch(addon: Addon, projectID: string, clusterID: string): Observable<Addon> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/addons/${addon.name}`;
    return this._httpClient.patch<Addon>(url, addon);
  }

  /**
   * Deletes addon from a cluster.
   *
   * @param addonID   ID of an addon
   * @param projectID ID of a project
   * @param clusterID ID of a cluster
   */
  delete(addonID: string, projectID: string, clusterID: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/addons/${addonID}`;
    return this._httpClient.delete<void>(url);
  }

  /**
   * Gets accessible addons (ones that can be deployed in a cluster).
   */
  get accessibleAddons(): Observable<string[]> {
    const url = `${this._restRoot}/addons`;
    return this._httpClient.get<string[]>(url);
  }

  /**
   * Gets addon configs (their descriptions, logos and form specs).
   */
  get addonConfigs(): Observable<AddonConfig[]> {
    if (!this._addonConfigs$) {
      this._addonConfigs$ = this._refreshTimer$
        .pipe(switchMap(() => this._httpClient.get<AddonConfig[]>(`${this._restRoot}/addonconfigs`)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._addonConfigs$;
  }
}
