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
import {BehaviorSubject, EMPTY, iif, merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, delay, first, map, retryWhen, shareReplay, switchMap, tap} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {Member} from '../../../shared/entity/member';
import {GroupConfig} from '../../../shared/model/Config';
import {MemberUtils} from '../../../shared/utils/member-utils/member-utils';
import {TokenService} from '../token/token.service';
import {
  AdminSettings,
  DEFAULT_ADMIN_SETTINGS,
  DEFAULT_USER_SETTINGS,
  UserSettings,
} from '../../../shared/entity/settings';
import {webSocket} from 'rxjs/webSocket';
import {Datacenter} from '../../../shared/entity/datacenter';

@Injectable()
export class UserService {
  private readonly restRoot = environment.restRoot;
  private readonly wsRoot = environment.wsRoot;
  private readonly _currentUser$ = new Subject<Member>();
  private readonly _currentUserSettings$ = new BehaviorSubject<UserSettings>(DEFAULT_USER_SETTINGS);
  private _currentUserWatch$: Observable<Member>;

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService,
    private readonly _tokenService: TokenService
  ) {}

  init(): void {
    const webSocket$ = webSocket<Member>(`${this.wsRoot}/me`)
      .asObservable()
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            // eslint-disable-next-line no-console
            tap(console.debug),
            delay(this._appConfigService.getRefreshTimeBase() * 3)
          )
        )
      );
    this._currentUserWatch$ = iif(() => this._tokenService.hasExpired(), webSocket$, EMPTY); // TODO: EMPTY?
    this._currentUserWatch$.subscribe(user => {
      this._currentUser$.next(user);
      this._currentUserSettings$.next(this._defaultUserSettings(user.settings));
    });
  }

  get currentUser(): Observable<Member> {
    return this._user$.pipe(shareReplay({bufferSize: 1}));
  }

  get currentUserSettings(): Observable<UserSettings> {
    return this._currentUserSettings$;
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

  get defaultUserSettings(): UserSettings {
    return DEFAULT_USER_SETTINGS;
  }

  patchCurrentUserSettings(patch: UserSettings): Observable<UserSettings> {
    const url = `${this.restRoot}/me/settings`;
    return this._httpClient.patch<UserSettings>(url, patch);
  }

  getCurrentUserGroup(projectID: string): Observable<string> {
    return this.currentUser.pipe(first()).pipe(map(member => MemberUtils.getGroupInProject(member, projectID)));
  }

  getCurrentUserGroupConfig(userGroup: string): GroupConfig {
    const userGroupConfig = this._appConfig.getUserGroupConfig();
    return userGroupConfig ? userGroupConfig[userGroup] : undefined;
  }

  logout(): Observable<boolean> {
    const url = `${this.restRoot}/me/logout`;
    return this.loggedInUser
      .pipe(switchMap(user => this._http.post(url, user)))
      .pipe(map(_ => true))
      .pipe(catchError(_ => of(false)))
      .pipe(first());
  }
}
