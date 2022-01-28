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
import {inject, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import {COOKIE, COOKIE_DI_TOKEN} from '@app/config';
import {AppConfigService} from '@app/config.service';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {UserService} from '@core/services/user';
import {CookieService} from 'ngx-cookie-service';
import {PreviousRouteService} from '../previous-route';
import {TokenService} from '../token';
import {Auth} from './service';

describe('Auth', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, RouterTestingModule],
      declarations: [],
      providers: [
        {provide: COOKIE_DI_TOKEN, useValue: COOKIE},
        UserService,
        TokenService,
        Auth,
        CookieService,
        PreviousRouteService,
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  it('should create auth services correctly', inject([Auth], (service: Auth) => {
    expect(service).toBeTruthy();
  }));
});
