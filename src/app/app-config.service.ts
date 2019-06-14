import {HttpClient} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {first, tap} from 'rxjs/operators';

import {environment} from '../environments/environment';

import {NotificationActions} from './redux/actions/notification.actions';
import {VersionInfo} from './shared/entity/VersionInfo';
import {Config, UserGroupConfig} from './shared/model/Config';
import {CustomLink, CustomLinkLocation} from './shared/utils/custom-link-utils/custom-link';

@Injectable()
export class AppConfigService {
  private _appConfig: Config;
  private _userGroupConfig: UserGroupConfig;
  private _gitVersion: VersionInfo;
  private _hasCustomCSS: boolean;
  private http: HttpClient;

  constructor(private inj: Injector) {
    this.http = this.inj.get(HttpClient);
  }

  loadAppConfig(): Promise<{}> {
    return this.http.get(environment.configUrl)
        .pipe(tap(
            (resp) => {
              this._appConfig = resp as Config;
            },
            () => {
              NotificationActions.error(`Could not read configuration file`);
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
              NotificationActions.error(`Could not read user group configuration file`);
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
              NotificationActions.error(`Could not read Git version file`);
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

  getCustomLinks(location?: CustomLinkLocation): CustomLink[] {
    let links = [];
    if (this._appConfig && this._appConfig.custom_links) {
      links = this._appConfig.custom_links.filter(link => {
        // Return all links if the location param is not specified.
        return !location
            // Return link if location does match.
            || location === link.location
            // Return link if default location was specified and link config is missing or is invalid.
            || (location === CustomLinkLocation.Default && !Object.values(CustomLinkLocation).includes(link.location));
      });
    }
    return links;
  }

  getRefreshTimeBase(): number {
    return environment.refreshTimeBase;
  }
}
