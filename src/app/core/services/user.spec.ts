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

import {HttpClientModule} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {SharedModule} from '@shared/module';
import {AppConfigService} from '@app/config.service';
import {COOKIE, COOKIE_DI_TOKEN} from '@app/config';
import {fakeUserGroupConfig} from '@app/testing/fake-data/user-group-config';
import {RouterTestingModule} from '@app/testing/router-stubs';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {AuthMockService} from '@app/testing/services/auth-mock';
import {Auth} from './auth/service';
import {TokenService} from './token';

import {UserService} from './user';

describe('Service: UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
      providers: [
        {provide: COOKIE_DI_TOKEN, useValue: COOKIE},
        UserService,
        TokenService,
        {provide: Auth, useClass: AuthMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
      teardown: {destroyAfterEach: false},
    });
    userService = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(userService).toBeTruthy();
  });

  it('should get user user group', () => {
    expect(userService.getCurrentUserGroupConfig('owners')).toEqual(fakeUserGroupConfig().owners);
  });
});
