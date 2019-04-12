import {Injectable} from '@angular/core';
import {VersionInfo} from '../../shared/entity/VersionInfo';
import {Config, UserGroupConfig} from '../../shared/model/Config';
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

  hasCustomCSS(): boolean {
    return false;
  }

  getCustomCSS(): string {
    return '';
  }
}
