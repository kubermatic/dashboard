import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {EMPTY, iif, Observable, of, timer} from 'rxjs';
import {catchError, map, publishReplay, refCount, switchMap} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {Auth} from '../auth/auth.service';

@Injectable()
export class UserService {
  private readonly restRoot: string = environment.restRoot;
  private _user$: Observable<MemberEntity>;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);

  constructor(private _http: HttpClient, private _appConfig: AppConfigService, private readonly _auth: Auth) {}

  get loggedInUser(): Observable<MemberEntity> {
    if (!this._user$) {
      this._user$ = this._refreshTimer$
                        .pipe(switchMap(() => iif(() => this._auth.authenticated(), this._getLoggedInUser(), EMPTY)))
                        .pipe(publishReplay(1))
                        .pipe(refCount());
    }

    return this._user$;
  }

  currentUserGroup(projectID: string): Observable<string> {
    return this.loggedInUser.pipe(map((member) => {
      const projects = member.projects ? member.projects : [];
      for (const project of projects) {
        if (project.id === projectID) {
          return project.group.split('-')[0];
        }
      }
      return '';
    }));
  }

  userGroupConfig(userGroup: string): GroupConfig {
    const userGroupConfig = this._appConfig.getUserGroupConfig();
    return !!userGroupConfig ? userGroupConfig[userGroup] : undefined;
  }

  private _getLoggedInUser(): Observable<MemberEntity> {
    const url = `${this.restRoot}/me`;
    return this._http.get<MemberEntity>(url).pipe(catchError(() => of<MemberEntity>()));
  }
}
