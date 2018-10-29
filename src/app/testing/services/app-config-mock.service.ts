import { Injectable } from '@angular/core';
import { fakeAppConfig } from '../fake-data/appConfig.fake';
import { fakeUserGroupConfig } from '../fake-data/userGroupConfig.fake';
import { Config, UserGroupConfig } from '../../shared/model/Config';

@Injectable()
export class AppConfigMockService {

  getConfig(): Config {
    return fakeAppConfig();
  }

  getUserGroupConfig(): UserGroupConfig {
    return fakeUserGroupConfig();
  }
}
