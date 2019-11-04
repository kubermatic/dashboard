import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, map, shareReplay, switchMap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {UserSettings} from '../../../shared/entity/MemberEntity';

const DEFAULT_USER_SETTINGS: UserSettings = {
  itemsPerPage: 10,
};

@Injectable()
export class SettingsService {
  private readonly restRoot: string = environment.restRoot;
  private _userSettings$: Observable<UserSettings>;
  private _settingsRefresh$: Subject<any> = new Subject();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 5);

  constructor(private _http: HttpClient, private _appConfig: AppConfigService) {}

  get userSettings(): Observable<UserSettings> {
    if (!this._userSettings$) {
      this._userSettings$ = merge(this._refreshTimer$, this._settingsRefresh$)
                                .pipe(switchMap(() => this._getUserSettings(true)))
                                .pipe(map(settings => this._defaultUserSettings(settings)))
                                .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._userSettings$;
  }

  private _getUserSettings(defaultOnError = false): Observable<UserSettings> {
    const url = `${this.restRoot}/me/settings`;
    const observable = this._http.get<UserSettings>(url);
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
    this._settingsRefresh$.next();
  }

  patchUserSettings(patch: UserSettings): Observable<UserSettings> {
    const url = `${this.restRoot}/me/settings`;
    return this._http.patch<UserSettings>(url, patch);
  }
}
