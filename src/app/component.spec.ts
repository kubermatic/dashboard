// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api';
import {AuthGuard} from '@core/services/auth/guard';
import {Auth} from '@core/services/auth/service';
import {DatacenterService} from '@core/services/datacenter';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {KubermaticComponent} from './component';
import {AppConfigService} from './config.service';
import {GoogleAnalyticsService} from './google-analytics.service';
import {ApiMockService} from './testing/services/api-mock';
import {AppConfigMockService} from './testing/services/app-config-mock';
import {AuthMockService} from './testing/services/auth-mock';
import {DatacenterMockService} from './testing/services/datacenter-mock';
import {ProjectMockService} from './testing/services/project-mock';
import {UserMockService} from './testing/services/user-mock';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  SharedModule,
  CoreModule,
];

const components: any[] = [KubermaticComponent];

describe('KubermaticComponent', () => {
  let fixture: ComponentFixture<KubermaticComponent>;
  let component: KubermaticComponent;
  let authService: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [...components],
      providers: [
        {provide: Auth, useClass: AuthMockService},
        {provide: ApiService, useClass: ApiMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        AuthGuard,
        GoogleAnalyticsService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubermaticComponent);
    component = fixture.componentInstance;
    authService = fixture.debugElement.injector.get(Auth) as any;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should show sidenav', () => {
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.mat-sidenav'));
    expect(de).not.toBeNull();
  });

  it('should not show sidenav', () => {
    authService.isAuth = false;
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.mat-sidenav'));
    expect(de).toBeNull();
  });
});
