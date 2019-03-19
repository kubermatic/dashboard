import {HttpClient} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {tap} from 'rxjs/operators';

import {environment} from '../environments/environment';

import {NotificationActions} from './redux/actions/notification.actions';
import {CustomLink} from './shared/entity/CustomLinks';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config, UserGroupConfig} from './shared/model/Config';

@Injectable()
export class AppConfigService {
  private appConfig: Config;
  private userGroupConfig: UserGroupConfig;
  private gitVersion: VersionInfo;
  private customLinks: CustomLink[] = [];
  private http: HttpClient;

  constructor(private inj: Injector) {
    this.http = this.inj.get(HttpClient);
  }

  loadAppConfig(): Promise<{}> {
    const jsonfile = environment.configUrl;
    return this.http.get(jsonfile)
        .pipe(tap(
            (resp: Config) => {
              this.appConfig = resp;
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
            (resp: UserGroupConfig) => {
              this.userGroupConfig = resp;
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
            (resp: VersionInfo) => {
              this.gitVersion = resp;
            },
            () => {
              NotificationActions.error('Error', `Could not read Git version file`);
            }))
        .toPromise();
  }

  getGitVersion(): VersionInfo {
    return this.gitVersion;
  }

  loadCustomLinks(): Promise<{}> {
    const jsonfile = environment.customLinksUrl;
    return this.http.get(jsonfile)
        .pipe(tap(
            (resp: CustomLink[]) => {
              this.customLinks = resp;
            },
            () => {
              NotificationActions.error('Error', `Could not read custom links file`);
            }))
        .toPromise();
  }

  getCustomLinks(): CustomLink[] {
    return this.customLinks;
  }
}
