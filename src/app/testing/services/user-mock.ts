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
import {Member} from '@shared/entity/member';
import {UserSettings} from '@shared/entity/settings';
import {GroupConfig} from '@shared/model/Config';
import {Observable, of} from 'rxjs';
import {fakeMember} from '../fake-data/member';
import {fakeUserGroupConfig} from '../fake-data/user-group-config';
import {DEFAULT_USER_SETTINGS_MOCK} from './settings-mock';

@Injectable()
export class UserMockService {
  private user: Observable<Member>;

  get currentUser(): Observable<Member> {
    this.user = of(fakeMember());
    return this.user;
  }

  get currentUserSettings(): Observable<UserSettings> {
    return of(DEFAULT_USER_SETTINGS_MOCK);
  }

  get defaultUserSettings(): UserSettings {
    return DEFAULT_USER_SETTINGS_MOCK;
  }

  getCurrentUserGroup(_projectID: string): Observable<string> {
    return of(fakeMember().projects[0].group);
  }

  getCurrentUserGroupConfig(userGroup: string): GroupConfig {
    return fakeUserGroupConfig()[userGroup];
  }
}
