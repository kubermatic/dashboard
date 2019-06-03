import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, of, timer} from 'rxjs';
import {catchError, map, shareReplay, switchMapTo} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {MemberEntity} from '../../../shared/entity/MemberEntity';
import {GroupConfig} from '../../../shared/model/Config';

@Injectable()
export class UserService {
  private readonly restRoot: string = environment.restRoot;
  private _user$: Observable<MemberEntity>;

  constructor(private _http: HttpClient, private _appConfig: AppConfigService) {}

  get loggedInUser(): Observable<MemberEntity> {
    if (!this._user$) {
      const timer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);
      this._user$ = timer$.pipe(switchMapTo(this._getLoggedInUser())).pipe(shareReplay(1));
    }

    return this._user$;
  }

  getCurrentUserGroup(projectID: string): Observable<string> {
    return this.loggedInUser.pipe(map((res) => {
      for (const project of res.projects) {
        if (project.id === projectID) {
          return project.group.split('-')[0];
        }
      }
      return '';
    }));
  }

  getUserGroupConfig(userGroup: string): GroupConfig {
    const userGroupConfig = this._appConfig.getUserGroupConfig();
    return !!userGroupConfig ? userGroupConfig[userGroup] : undefined;
  }

  private _getLoggedInUser(): Observable<MemberEntity> {
    const url = `${this.restRoot}/me`;
    return this._http.get<MemberEntity>(url).pipe(catchError(() => of<MemberEntity>()));
  }
}
