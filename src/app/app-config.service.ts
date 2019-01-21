import {HttpClient} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';

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
    setTimeout(() => {
      this.http = this.inj.get(HttpClient);
    });
  }

  loadAppConfig(): void {
    const jsonfile = environment.configUrl;
    setTimeout(() => {
      return this.http.get(jsonfile)
          .toPromise()
          .then((resp) => {
            this.appConfig = resp as Config;
          })
          .catch(() => {
            NotificationActions.error('Error', `Could not read configuration file`);
          });
    });
  }

  getConfig(): Config {
    return this.appConfig;
  }

  loadUserGroupConfig(): void {
    const jsonfile = '../assets/config/userGroupConfig.json';
    setTimeout(() => {
      return this.http.get(jsonfile)
          .toPromise()
          .then((resp) => {
            this.userGroupConfig = resp as UserGroupConfig;
          })
          .catch(() => {
            NotificationActions.error('Error', `Could not read user group configuration file`);
          });
    });
  }

  getUserGroupConfig(): UserGroupConfig {
    return this.userGroupConfig;
  }

  loadGitVersion(): void {
    const jsonfile = environment.gitVersionUrl;
    setTimeout(() => {
      return this.http.get(jsonfile)
          .toPromise()
          .then((resp) => {
            this.gitVersion = resp as VersionInfo;
          })
          .catch(() => {
            NotificationActions.error('Error', `Could not read Git version file`);
          });
    });
  }

  getGitVersion(): VersionInfo {
    return this.gitVersion;
  }
}
