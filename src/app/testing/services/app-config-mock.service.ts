import {Injectable} from '@angular/core';

import {VersionInfo} from '../../shared/entity/version-info';
import {Config, UserGroupConfig} from '../../shared/model/Config';
import {fakeAppConfig} from '../fake-data/appConfig.fake';
import {fakeUserGroupConfig} from '../fake-data/userGroupConfig.fake';
import {fakeVersionInfo} from '../fake-data/versionInfo.fake';
import {CustomLink} from '../../shared/entity/settings';

@Injectable()
export class AppConfigMockService {
  getConfig(): Config {
    return fakeAppConfig();
  }

  getUserGroupConfig(): UserGroupConfig {
    return fakeUserGroupConfig();
  }

  getGitVersion(): VersionInfo {
    return fakeVersionInfo();
  }

  getCustomLinks(): CustomLink[] {
    return [];
  }

  getRefreshTimeBase(): number {
    return 1000;
  }
}
