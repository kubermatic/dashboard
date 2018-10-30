import { HttpClient } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { environment } from '../environments/environment';
import { NotificationActions } from './redux/actions/notification.actions';
import { Config, UserGroupConfig } from './shared/model/Config';

@Injectable()
export class AppConfigService {
  private appConfig: Config;
  private userGroupConfig: UserGroupConfig;
  private http: HttpClient;

  constructor(private inj: Injector) {
    setTimeout(() => {
      this.http = this.inj.get(HttpClient);
    });
  }

  loadAppConfig(): void {
    const jsonfile = environment.configUrl;
    setTimeout(() => {
      return this.http.get(jsonfile).toPromise().then(resp => {
        this.appConfig = <Config> resp;
      }).catch(() => {
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
      return this.http.get(jsonfile).toPromise().then(resp => {
        this.userGroupConfig = <UserGroupConfig> resp;
      }).catch(() => {
        NotificationActions.error('Error', `Could not read user group configuration file`);
      });
    });
  }

  getUserGroupConfig(): UserGroupConfig {
    return this.userGroupConfig;
  }
}
