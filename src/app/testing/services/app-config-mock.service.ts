import {Injectable} from '@angular/core';
import {Config, UserGroupConfig} from '../../shared/model/Config';
import {fakeAppConfig} from '../fake-data/appConfig.fake';
import {fakeUserGroupConfig} from '../fake-data/userGroupConfig.fake';

@Injectable()
export class AppConfigMockService {
  getConfig(): Config {
    return fakeAppConfig();
  }

  getUserGroupConfig(): UserGroupConfig {
    return fakeUserGroupConfig();
  }
}
