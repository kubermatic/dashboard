import {HttpClient} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {tap} from 'rxjs/operators';

import {environment} from '../environments/environment';

import {NotificationActions} from './redux/actions/notification.actions';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config, UserGroupConfig} from './shared/model/Config';

@Injectable()
export class AppConfigService {
  private appConfig: Config;
  private userGroupConfig: UserGroupConfig;
  private gitVersion: VersionInfo;
  private http: HttpClient;

  constructor(private inj: Injector) {
    this.http = this.inj.get(HttpClient);
  }

  loadAppConfig(): Promise<{}> {
    const jsonfile = environment.configUrl;
    return this.http.get(jsonfile)
        .pipe(tap(
            (resp) => {
              this.appConfig = resp as Config;
            },
            () => {
              NotificationActions.error('Error', `Could not read configuration file`);
            }))
        .toPromise();
  }

  getConfig(): Config {
    return this.appConfig;
  }

  loadUserGroupConfig(): Promise<{}> {
    const jsonfile = '../assets/config/userGroupConfig.json';
    return this.http.get(jsonfile)
        .pipe(tap(
            (resp) => {
              this.userGroupConfig = resp as UserGroupConfig;
            },
            () => {
              NotificationActions.error('Error', `Could not read user group configuration file`);
            }))
        .toPromise();
  }

  getUserGroupConfig(): UserGroupConfig {
    return this.userGroupConfig;
  }

  loadGitVersion(): Promise<{}> {
    const jsonfile = environment.gitVersionUrl;
    return this.http.get(jsonfile)
        .pipe(tap(
            (resp) => {
              this.gitVersion = resp as VersionInfo;
            },
            () => {
              NotificationActions.error('Error', `Could not read Git version file`);
            }))
        .toPromise();
  }

  getGitVersion(): VersionInfo {
    return this.gitVersion;
  }
}
