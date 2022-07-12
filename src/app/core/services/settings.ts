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

import {catchError, delay, map, retryWhen, shareReplay, switchMap} from 'rxjs/operators';
import {BehaviorSubject, EMPTY, iif, merge, Observable, of, Subject, timer} from 'rxjs';
import {webSocket} from 'rxjs/webSocket';

import {AdminSettings, CustomLink, DEFAULT_ADMIN_SETTINGS} from '@shared/entity/settings';
import {Admin, Member} from '@shared/entity/member';

import {environment} from '@environments/environment';
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly _restRoot = environment.restRoot;
  private readonly _newRestRoot = environment.newRestRoot;
  private readonly _wsRoot = environment.wsRoot;
  private readonly _adminSettings$ = new BehaviorSubject(DEFAULT_ADMIN_SETTINGS);
  private readonly _refreshTime = 5;
  private readonly _retryTime = 3;
  private _adminSettingsWatch$: Observable<AdminSettings>;
  private _admins$: Observable<Admin[]>;
  private _adminsRefresh$ = new Subject<void>();
  private _users$: Observable<Member[]>;
  private _usersRefresh$ = new Subject<void>();
  private _customLinks$: Observable<CustomLink[]>;
  private _customLinksRefresh$ = new Subject<void>();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _appConfigService: AppConfigService,
    private readonly _auth: Auth
  ) {}

  get adminSettings(): Observable<AdminSettings> {
    if (!this._adminSettingsWatch$) {
      this._adminSettingsWatch$ = iif(
        () => this._auth.authenticated(),
        environment.avoidWebsockets ? this._getAdminSettings() : this._getAdminSettingsWebSocket(),
        of(DEFAULT_ADMIN_SETTINGS)
      );
      this._adminSettingsWatch$.subscribe(settings => this._adminSettings$.next(this._defaultAdminSettings(settings)));
    }

    return this._adminSettings$;
  }

  private _getAdminSettingsWebSocket(): Observable<AdminSettings> {
    return webSocket<AdminSettings>(`${this._wsRoot}/admin/settings`)
      .asObservable()
      .pipe(retryWhen(errors => errors.pipe(delay(this._appConfigService.getRefreshTimeBase() * this._retryTime))));
  }

  private _getAdminSettings(): Observable<AdminSettings> {
    const url = `${this._restRoot}/admin/settings`;
    const observable = this._httpClient.get<AdminSettings>(url).pipe(catchError(() => of(DEFAULT_ADMIN_SETTINGS)));
    return this._refreshTimer$
      .pipe(switchMap(_ => iif(() => this._auth.authenticated(), observable, EMPTY)))
      .pipe(shareReplay({refCount: true, bufferSize: 1}));
  }

  get defaultAdminSettings(): AdminSettings {
    return DEFAULT_ADMIN_SETTINGS;
  }

  private _defaultAdminSettings(settings: AdminSettings): AdminSettings {
    return {...DEFAULT_ADMIN_SETTINGS, ...settings};
  }

  patchAdminSettings(patch: AdminSettings): Observable<AdminSettings> {
    const url = `${this._restRoot}/admin/settings`;
    return this._httpClient
      .patch<AdminSettings>(url, patch)
      .pipe(map(settings => this._defaultAdminSettings(settings)));
  }

  get customLinks(): Observable<CustomLink[]> {
    if (!this._customLinks$) {
      this._customLinks$ = merge(this._refreshTimer$, this._customLinksRefresh$)
        .pipe(switchMap(() => this.getCustomLinks_()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._customLinks$;
  }

  private getCustomLinks_(): Observable<CustomLink[]> {
    const url = `${this._restRoot}/admin/settings/customlinks`;
    return this._httpClient.get<CustomLink[]>(url).pipe(catchError(() => of([])));
  }

  refreshCustomLinks(): void {
    this._customLinksRefresh$.next();
  }

  get admins(): Observable<Admin[]> {
    if (!this._admins$) {
      this._admins$ = merge(this._refreshTimer$, this._adminsRefresh$)
        .pipe(switchMap(() => this._getAdmins()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._admins$;
  }

  private _getAdmins(): Observable<Admin[]> {
    const url = `${this._restRoot}/admin`;
    return this._httpClient.get<Admin[]>(url);
  }

  refreshAdmins(): void {
    this._adminsRefresh$.next();
  }

  setAdmin(admin: Admin): Observable<Admin> {
    const url = `${this._restRoot}/admin`;
    return this._httpClient.put<Admin>(url, admin);
  }

  get users(): Observable<Member[]> {
    if (!this._users$) {
      this._users$ = merge(this._refreshTimer$, this._usersRefresh$)
        .pipe(switchMap(() => this._getUsers()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._users$;
  }

  private _getUsers(): Observable<Member[]> {
    const url = `${this._newRestRoot}/users`;
    return this._httpClient.get<Member[]>(url);
  }

  refreshUsers(): void {
    this._usersRefresh$.next();
  }
}
