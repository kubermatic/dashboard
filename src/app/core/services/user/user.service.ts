import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {EMPTY, iif, Observable, of, timer} from 'rxjs';
import {catchError, first, map, shareReplay, switchMap} from 'rxjs/operators';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {Member} from '../../../shared/entity/member';
import {GroupConfig} from '../../../shared/model/Config';
import {MemberUtils} from '../../../shared/utils/member-utils/member-utils';
import {Auth} from '../auth/auth.service';

@Injectable()
export class UserService {
  private readonly restRoot: string = environment.restRoot;
  private _user$: Observable<Member>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(private _http: HttpClient, private _appConfig: AppConfigService, private readonly _auth: Auth) {}

  get loggedInUser(): Observable<Member> {
    if (!this._user$) {
      this._user$ = this._refreshTimer$
        .pipe(switchMap(() => iif(() => this._auth.authenticated(), this._getLoggedInUser(), EMPTY)))
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

  private _getLoggedInUser(): Observable<Member> {
    const url = `${this.restRoot}/me`;
    return this._http.get<Member>(url).pipe(catchError(() => of<Member>()));
  }
}
