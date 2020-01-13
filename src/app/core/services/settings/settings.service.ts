import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {iif, merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, map, shareReplay, switchMap} from 'rxjs/operators';

import {Auth} from '..';
import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {AdminEntity, AdminSettings, ClusterTypeOptions} from '../../../shared/entity/AdminSettings';
import {Theme, UserSettings} from '../../../shared/entity/MemberEntity';

const DEFAULT_USER_SETTINGS: UserSettings = {
  itemsPerPage: 10,
  selectProjectTableView: false,
  selectedTheme: Theme.Light,
};

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  cleanupOptions: {
    Enforced: false,
    Enabled: false,
  },
  clusterTypeOptions: ClusterTypeOptions.All,
  customLinks: [],
  defaultNodeCount: 1,
  displayAPIDocs: true,
  displayDemoInfo: false,
  displayTermsOfService: false,
  enableDashboard: true,
  enableOIDCKubeconfig: false,
};

@Injectable()
export class SettingsService {
  private readonly restRoot: string = environment.restRoot;
  private _userSettings$: Observable<UserSettings>;
  private _userSettingsRefresh$: Subject<any> = new Subject();
  private _adminSettings$: Observable<AdminSettings>;
  private _adminSettingsRefresh$: Subject<any> = new Subject();
  private _admins$: Observable<AdminEntity[]>;
  private _adminsRefresh$: Subject<any> = new Subject();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * 5);

  constructor(
      private readonly _httpClient: HttpClient, private readonly _appConfigService: AppConfigService,
      private readonly _auth: Auth) {}

  get userSettings(): Observable<UserSettings> {
    if (!this._userSettings$) {
      this._userSettings$ =
          merge(this._refreshTimer$, this._userSettingsRefresh$)
              .pipe(switchMap(
                  () => iif(() => this._auth.authenticated(), this._getUserSettings(true), of(DEFAULT_USER_SETTINGS))))
              .pipe(map(settings => this._defaultUserSettings(settings)))
              .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._userSettings$;
  }

  private _getUserSettings(defaultOnError = false): Observable<UserSettings> {
    const url = `${this.restRoot}/me/settings`;
    const observable = this._httpClient.get<UserSettings>(url);
    return defaultOnError ? observable.pipe(catchError(() => of(DEFAULT_USER_SETTINGS))) : observable;
  }

  private _defaultUserSettings(settings: UserSettings): UserSettings {
    if (!settings) {
      return DEFAULT_USER_SETTINGS;
    }

    Object.keys(DEFAULT_USER_SETTINGS).forEach(key => {
      settings[key] = settings[key] || DEFAULT_USER_SETTINGS[key];
    });

    return settings;
  }

  refreshUserSettings(): void {
    this._userSettingsRefresh$.next();
  }

  patchUserSettings(patch: UserSettings): Observable<UserSettings> {
    const url = `${this.restRoot}/me/settings`;
    return this._httpClient.patch<UserSettings>(url, patch);
  }

  get adminSettings(): Observable<AdminSettings> {
    if (!this._adminSettings$) {
      this._adminSettings$ =
          merge(this._refreshTimer$, this._adminSettingsRefresh$)
              .pipe(switchMap(
                  () =>
                      iif(() => this._auth.authenticated(), this._getAdminSettings(true), of(DEFAULT_ADMIN_SETTINGS))))
              .pipe(map(settings => this._defaultAdminSettings(settings)))
              .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._adminSettings$;
  }

  get defaultAdminSettings(): AdminSettings {
    return DEFAULT_ADMIN_SETTINGS;
  }

  private _getAdminSettings(defaultOnError = false): Observable<AdminSettings> {
    const url = `${this.restRoot}/admin/settings`;
    const observable = this._httpClient.get<AdminSettings>(url);
    return defaultOnError ? observable.pipe(catchError(() => of(DEFAULT_ADMIN_SETTINGS))) : observable;
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

  refreshAdminSettings(): void {
    this._adminSettingsRefresh$.next();
  }

  patchAdminSettings(patch: any): Observable<AdminSettings> {
    const url = `${this.restRoot}/admin/settings`;
    return this._httpClient.patch<AdminSettings>(url, patch);
  }

  get admins(): Observable<AdminEntity[]> {
    if (!this._admins$) {
      this._admins$ = merge(this._refreshTimer$, this._adminsRefresh$)
                          .pipe(switchMap(() => this._getAdmins()))
                          .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._admins$;
  }

  private _getAdmins(): Observable<AdminEntity[]> {
    const url = `${this.restRoot}/admin`;
    return this._httpClient.get<AdminEntity[]>(url);
  }

  refreshAdmins(): void {
    this._adminsRefresh$.next();
  }

  setAdmin(admin: AdminEntity): Observable<AdminEntity> {
    const url = `${this.restRoot}/admin`;
    return this._httpClient.put<AdminEntity>(url, admin);
  }
}
