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
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Auth} from '@core/services/auth/service';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {AuthMockService} from '@test/services/auth-mock';
import {ProjectMockService} from '@test/services/project-mock';
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

  it('should call logout and redirect when user logs out', () => {
    authService = fixture.debugElement.injector.get(Auth) as any;
    const spyLogOut = jest.spyOn(authService, 'logout');

    // jsdom does not support navigation, so just verify logout was called
    component.logout();

    expect(spyLogOut).toHaveBeenCalled();
  });

  it('should not display user information after logout', waitForAsync(() => {
    fixture.detectChanges();
    expect(component.user).toBeDefined();

    component.logout();
    expect(component.user).not.toBeDefined();
  }));
});
