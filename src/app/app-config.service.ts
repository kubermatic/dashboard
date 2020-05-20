import {HttpClient} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {tap} from 'rxjs/operators';

import {environment} from '../environments/environment';

import {NotificationService} from './core/services/notification/notification.service';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config, UserGroupConfig} from './shared/model/Config';

@Injectable()
export class AppConfigService {
  private _appConfig: Config;
  private _userGroupConfig: UserGroupConfig;
  private _gitVersion: VersionInfo;
  private readonly _http: HttpClient;
  private readonly _notificationService: NotificationService;

  constructor(private readonly _inj: Injector) {
    this._http = this._inj.get(HttpClient);
    this._notificationService = this._inj.get(NotificationService);
  }

  loadAppConfig(): Promise<{}> {
    return this._http
      .get(environment.configUrl)
      .pipe(
        tap(
          resp => {
            this._appConfig = resp as Config;
          },
          () => {
            this._notificationService.error(
              'Could not read configuration file'
            );
          }
        )
      )
      .toPromise();
  }

  getConfig(): Config {
    return this._appConfig;
  }

  loadUserGroupConfig(): Promise<{}> {
    return this._http
      .get('../assets/config/userGroupConfig.json')
      .pipe(
        tap(
          resp => {
            this._userGroupConfig = resp as UserGroupConfig;
          },
          () => {
            this._notificationService.error(
              'Could not read user group configuration file'
            );
          }
        )
      )
      .toPromise();
  }

  getUserGroupConfig(): UserGroupConfig {
    return this._userGroupConfig;
  }

  loadGitVersion(): Promise<{}> {
    return this._http
      .get(environment.gitVersionUrl)
      .pipe(
        tap(
          resp => {
            this._gitVersion = resp as VersionInfo;
          },
          () => {
            this._notificationService.error('Could not read Git version file');
          }
        )
      )
      .toPromise();
  }

  getGitVersion(): VersionInfo {
    return this._gitVersion;
  }

  getRefreshTimeBase(): number {
    return environment.refreshTimeBase;
  }
}
