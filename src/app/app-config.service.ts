import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Config, UserGroupConfig } from './shared/model/Config';
import { NotificationActions } from './redux/actions/notification.actions';
import { environment } from '../environments/environment';

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

  loadAppConfig() {
    const jsonfile = environment.configUrl;
    setTimeout(() => {
      return this.http.get(jsonfile).toPromise().then(resp => {
        this.appConfig = <Config>resp;
      }).catch(error => {
        NotificationActions.error('Error', `Could not read configuration file`);
      });
    });
  }

  getConfig() {
    return this.appConfig;
  }

  loadUserGroupConfig() {
    const jsonfile = '../assets/config/userGroupConfig.json';
    setTimeout(() => {
      return this.http.get(jsonfile).toPromise().then(resp => {
        this.userGroupConfig = <UserGroupConfig>resp;
      }).catch(error => {
        NotificationActions.error('Error', `Could not read user group configuration file`);
      });
    });
  }

  getUserGroupConfig() {
    return this.userGroupConfig;
  }
}
