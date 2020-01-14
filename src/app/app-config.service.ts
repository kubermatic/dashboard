import {HttpClient} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {NotificationsService} from 'angular2-notifications';
import {first, tap} from 'rxjs/operators';

import {environment} from '../environments/environment';

import {VersionInfo} from './shared/entity/VersionInfo';
import {Config, UserGroupConfig} from './shared/model/Config';

@Injectable()
export class AppConfigService {
  private _appConfig: Config;
  private _userGroupConfig: UserGroupConfig;
  private _gitVersion: VersionInfo;
  private _hasCustomCSS: boolean;
  private http: HttpClient;

  constructor(private readonly _inj: Injector, private readonly _notificationService: NotificationsService) {
    this.http = this._inj.get(HttpClient);
  }

  loadAppConfig(): Promise<{}> {
    return this.http.get(environment.configUrl)
        .pipe(tap(
            (resp) => {
              this._appConfig = resp as Config;
            },
            () => {
              this._notificationService.error(`Could not read configuration file`);
            }))
        .toPromise();
  }

  getConfig(): Config {
    return this._appConfig;
  }

  loadUserGroupConfig(): Promise<{}> {
    return this.http.get('../assets/config/userGroupConfig.json')
        .pipe(tap(
            (resp) => {
              this._userGroupConfig = resp as UserGroupConfig;
            },
            () => {
              this._notificationService.error(`Could not read user group configuration file`);
            }))
        .toPromise();
  }

  getUserGroupConfig(): UserGroupConfig {
    return this._userGroupConfig;
  }

  loadGitVersion(): Promise<{}> {
    return this.http.get(environment.gitVersionUrl)
        .pipe(tap(
            (resp) => {
              this._gitVersion = resp as VersionInfo;
            },
            () => {
              this._notificationService.error(`Could not read Git version file`);
            }))
        .toPromise();
  }

  getGitVersion(): VersionInfo {
    return this._gitVersion;
  }

  checkCustomCSS(): Promise<{}> {
    return new Promise((resolve => {
      this.http.head(environment.customCSS)
          .pipe(first())
          .subscribe(
              () => {
                this._hasCustomCSS = true;
                resolve();
              },
              () => {
                this._hasCustomCSS = false;
                resolve();
              });
    }));
  }

  hasCustomCSS(): boolean {
    return this._hasCustomCSS;
  }

  getCustomCSS(): string {
    return environment.customCSS;
  }

  getRefreshTimeBase(): number {
    return environment.refreshTimeBase;
  }
}
