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
import {BehaviorSubject, EMPTY, iif, Observable, of} from 'rxjs';
import {catchError, delay, filter, take, map, retryWhen, switchMap, tap} from 'rxjs/operators';
import {environment} from '@environments/environment';
import {AppConfigService} from '@app/config.service';
import {Member} from '@shared/entity/member';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils} from '@shared/utils/member-utils/member-utils';
import {TokenService} from '../token/service';
import {DEFAULT_USER_SETTINGS, UserSettings} from '@shared/entity/settings';
import {webSocket} from 'rxjs/webSocket';

@Injectable()
export class UserService {
  private readonly restRoot = environment.restRoot;
  private readonly wsRoot = environment.wsRoot;
  private readonly _currentUser$ = new BehaviorSubject<Member>(undefined);
  private readonly _currentUserSettings$ = new BehaviorSubject<UserSettings>(DEFAULT_USER_SETTINGS);
  private readonly _refreshTime = 3; // in seconds

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _appConfigService: AppConfigService,
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
            delay(this._appConfigService.getRefreshTimeBase() * this._refreshTime)
          )
        )
      );

    iif(() => this._tokenService.hasExpired(), webSocket$, EMPTY)
      .pipe(filter(user => !!user))
      .subscribe(user => {
        this._currentUser$.next(user);
        this._currentUserSettings$.next(this._defaultUserSettings(user.userSettings));
      });
  }

  get currentUser(): Observable<Member> {
    return this._currentUser$.pipe(filter(user => !!user));
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
    return this.currentUser.pipe(map(member => MemberUtils.getGroupInProject(member, projectID)));
  }

  getCurrentUserGroupConfig(userGroup: string): GroupConfig {
    const userGroupConfig = this._appConfigService.getUserGroupConfig();
    return userGroupConfig ? userGroupConfig[userGroup] : undefined;
  }

  logout(): Observable<boolean> {
    const url = `${this.restRoot}/me/logout`;
    return this.currentUser
      .pipe(switchMap(user => this._httpClient.post(url, user)))
      .pipe(map(_ => true))
      .pipe(catchError(_ => of(false)))
      .pipe(take(1));
  }
}
