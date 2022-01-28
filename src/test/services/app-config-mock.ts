// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Injectable} from '@angular/core';
import {CustomLink} from '@shared/entity/settings';
import {VersionInfo} from '@shared/entity/version-info';
import {Config, EndOfLife, UserGroupConfig} from '@shared/model/Config';
import {fakeUserGroupConfig} from '../data/user-group-config';

@Injectable()
export class AppConfigMockService {
  private readonly _refreshTimeBase = 200;

  getConfig(): Config {
    return {
      share_kubeconfig: false,
      openstack: {
        wizard_use_default_user: false,
      },
    };
  }

  getUserGroupConfig(): UserGroupConfig {
    return fakeUserGroupConfig();
  }

  getGitVersion(): VersionInfo {
    return {
      dirty: true,
      distance: 10,
      hash: '1234abcd',
      raw: 'v1.0.0',
      semverString: 'v1.0.0',
      humanReadable: 'v1.0.0',
      suffix: '',
      tag: 'v1.0.0',
    } as VersionInfo;
  }

  getCustomLinks(): CustomLink[] {
    return [];
  }

  getRefreshTimeBase(): number {
    return this._refreshTimeBase;
  }

  getEndOfLifeConfig(): EndOfLife {
    return {};
  }
}
