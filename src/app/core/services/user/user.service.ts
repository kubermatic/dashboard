import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {EMPTY, iif, Observable, of, timer} from 'rxjs';
import {catchError, first, map, shareReplay, switchMap} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {MemberUtils} from '../../../shared/utils/member-utils/member-utils';
import {TokenService} from '../token/token.service';

@Injectable()
export class UserService {
  private readonly restRoot: string = environment.restRoot;
  private _user$: Observable<MemberEntity>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService,
    private readonly _tokenService: TokenService
  ) {}

  get loggedInUser(): Observable<MemberEntity> {
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

  private _getLoggedInUser(): Observable<MemberEntity> {
    const url = `${this.restRoot}/me`;
    return this._http.get<MemberEntity>(url).pipe(catchError(_ => of<MemberEntity>()));
  }
}
