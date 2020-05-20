import {Injectable} from '@angular/core';

import {VersionInfo} from '../../shared/entity/VersionInfo';
import {Config, UserGroupConfig} from '../../shared/model/Config';
import {CustomLink} from '../../shared/utils/custom-link-utils/custom-link';
import {fakeAppConfig} from '../fake-data/appConfig.fake';
import {fakeUserGroupConfig} from '../fake-data/userGroupConfig.fake';
import {fakeVersionInfo} from '../fake-data/versionInfo.fake';

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
