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
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';
import {environment} from '@environments/environment';
import {Admin} from '@shared/entity/member';
import {Report} from '@shared/entity/metering';
import {AdminSettings, CustomLink, DEFAULT_ADMIN_SETTINGS} from '@shared/entity/settings';
import {BehaviorSubject, iif, merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, delay, retryWhen, shareReplay, switchMap, tap} from 'rxjs/operators';
import {webSocket} from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly restRoot = environment.restRoot;
  private readonly wsRoot = environment.wsRoot;
  private readonly _adminSettings$ = new BehaviorSubject(DEFAULT_ADMIN_SETTINGS);
  private readonly _refreshTime = 5; // in seconds
  private readonly _retryDelayTime = 3; // in seconds
  private _adminSettingsWatch$: Observable<AdminSettings>;
  private _admins$: Observable<Admin[]>;
  private _adminsRefresh$ = new Subject<void>();
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
      const webSocket$ = webSocket<AdminSettings>(`${this.wsRoot}/admin/settings`)
        .asObservable()
        .pipe(
          retryWhen(errors =>
            errors.pipe(
              // eslint-disable-next-line no-console
              tap(console.debug),
              delay(this._appConfigService.getRefreshTimeBase() * this._retryDelayTime)
            )
          )
        );
      this._adminSettingsWatch$ = iif(() => this._auth.authenticated(), webSocket$, of(DEFAULT_ADMIN_SETTINGS));
      this._adminSettingsWatch$.subscribe(settings => this._adminSettings$.next(this._defaultAdminSettings(settings)));
    }

    return this._adminSettings$;
  }

  get defaultAdminSettings(): AdminSettings {
    return DEFAULT_ADMIN_SETTINGS;
  }

  private _defaultAdminSettings(settings: AdminSettings): AdminSettings {
    if (!settings) {
      return DEFAULT_ADMIN_SETTINGS;
    }

    Object.keys(DEFAULT_ADMIN_SETTINGS).forEach(key => {
      settings[key] = settings[key] === undefined ? DEFAULT_ADMIN_SETTINGS[key] : settings[key];
    });

    return settings;
  }

  patchAdminSettings(patch: any): Observable<AdminSettings> {
    const url = `${this.restRoot}/admin/settings`;
    return this._httpClient.patch<AdminSettings>(url, patch);
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
    const url = `${this.restRoot}/admin/settings/customlinks`;
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
    const url = `${this.restRoot}/admin`;
    return this._httpClient.get<Admin[]>(url);
  }

  refreshAdmins(): void {
    this._adminsRefresh$.next();
  }

  setAdmin(admin: Admin): Observable<Admin> {
    const url = `${this.restRoot}/admin`;
    return this._httpClient.put<Admin>(url, admin);
  }

  get reports(): Observable<Report[]> {
    const url = `${this.restRoot}/admin/metering/reports`;
    return this._httpClient.get<Report[]>(url);
  }

  reportDownload(reportName: string): Observable<string> {
    const url = `${this.restRoot}/admin/metering/reports/${reportName}`;
    return this._httpClient.get<string>(url);
  }
}
