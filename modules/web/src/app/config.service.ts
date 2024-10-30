// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { HttpClient } from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {NotificationService} from '@core/services/notification';
import {environment} from '@environments/environment';
import {VersionInfo} from '@shared/entity/version-info';
import {Config, EndOfLife, UserGroupConfig} from '@shared/model/Config';
import {tap} from 'rxjs/operators';
import {Observable, lastValueFrom} from 'rxjs';

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
    return lastValueFrom(
      this._http.get(environment.configUrl).pipe(
        tap({
          next: resp => {
            this._appConfig = (resp as Config) || {};
          },
          error: () => {
            this._notificationService.error('Could not read configuration file');
          },
        })
      )
    );
  }

  getConfig(): Config {
    return this._appConfig;
  }

  loadUserGroupConfig(): Promise<{}> {
    return lastValueFrom(
      this._http.get('../assets/config/userGroupConfig.json').pipe(
        tap({
          next: resp => {
            this._userGroupConfig = resp as UserGroupConfig;
          },
          error: () => {
            this._notificationService.error('Could not read user group configuration file');
          },
        })
      )
    );
  }

  getUserGroupConfig(): UserGroupConfig {
    return this._userGroupConfig;
  }

  loadGitVersion(): Promise<{}> {
    return lastValueFrom(
      this._http.get(environment.gitVersionUrl).pipe(
        tap({
          next: resp => {
            this._gitVersion = resp as VersionInfo;
          },
          error: () => {
            this._notificationService.error('Could not read Git version file');
          },
        })
      )
    );
  }

  getGitVersion(): VersionInfo {
    return this._gitVersion;
  }

  getRefreshTimeBase(): number {
    return environment.refreshTimeBase;
  }

  getEndOfLifeConfig(): EndOfLife {
    return this._appConfig.end_of_life ? this._appConfig.end_of_life : {};
  }

  getSwaggerJson(): Observable<any> {
    const url = '/api/swagger.json';
    return this._http.get(url);
  }
}
