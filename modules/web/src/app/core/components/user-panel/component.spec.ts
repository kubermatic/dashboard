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
import {ComponentFixture, inject, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {Auth} from '@core/services/auth/service';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {UserPanelComponent} from './component';

describe('UserPanelComponent', () => {
  let fixture: ComponentFixture<UserPanelComponent>;
  let component: UserPanelComponent;
  let authService: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [UserPanelComponent],
      providers: [
        MatDialog,
        {provide: UserService, useClass: UserMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserPanelComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should tell Router to navigate when user logout', inject([Router], (router: Router) => {
    authService = fixture.debugElement.injector.get(Auth) as any;
    const spyNavigate = jest.spyOn(router, 'navigate');
    const spyLogOut = jest.spyOn(authService, 'logout');

    component.logout();

    expect(spyNavigate).toHaveBeenCalled();
    expect(spyLogOut).toHaveBeenCalled();
  }));

  it('should not display user information after logout', waitForAsync(() => {
    fixture.detectChanges();
    expect(component.user).toBeDefined();

    component.logout();
    expect(component.user).not.toBeDefined();
  }));
});
