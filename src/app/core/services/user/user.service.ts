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
import {EMPTY, iif, Observable, of, timer} from 'rxjs';
import {catchError, first, map, shareReplay, switchMap} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {Member} from '../../../shared/entity/member';
import {GroupConfig} from '../../../shared/model/Config';
import {MemberUtils} from '../../../shared/utils/member-utils/member-utils';
import {TokenService} from '../token/token.service';

@Injectable()
export class UserService {
  private readonly restRoot: string = environment.restRoot;
  private _user$: Observable<Member>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService,
    private readonly _tokenService: TokenService
  ) {}

  get loggedInUser(): Observable<Member> {
    if (!this._user$) {
      this._user$ = this._refreshTimer$
        .pipe(switchMap(() => iif(() => this._tokenService.hasExpired(), this._getLoggedInUser(), EMPTY)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._user$;
  }

  currentUserGroup(projectID: string): Observable<string> {
    return this.loggedInUser.pipe(first()).pipe(map(member => MemberUtils.getGroupInProject(member, projectID)));
  }

  userGroupConfig(userGroup: string): GroupConfig {
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

  private _getLoggedInUser(): Observable<Member> {
    const url = `${this.restRoot}/me`;
    return this._http.get<Member>(url).pipe(catchError(_ => of<Member>()));
  }
}
