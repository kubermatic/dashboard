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

import { HttpClientModule } from '@angular/common/http';
import { inject, TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorNotificationsInterceptor } from '@core/interceptors';
import { CoreModule } from '@core/module';
import { SettingsService } from '@core/services/settings';
import { SharedModule } from '@shared/module';
import { SettingsMockService } from '@test/services/settings-mock';

describe('ErrorNotificationsInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [ErrorNotificationsInterceptor, {provide: SettingsService, useClass: SettingsMockService}],
      teardown: {destroyAfterEach: false},
    });
  });

  it('should be created', inject([ErrorNotificationsInterceptor], (service: ErrorNotificationsInterceptor) => {
    expect(service).toBeTruthy();
  }));
});
