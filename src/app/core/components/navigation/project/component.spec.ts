// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {fakeProjects} from '@app/testing/fake-data/project.fake';
import {RouterTestingModule} from '@app/testing/router-stubs';
import {ApiMockService} from '@app/testing/services/api-mock.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {AuthMockService} from '@app/testing/services/auth-mock.service';
import {ProjectMockService} from '@app/testing/services/project-mock.service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {NotificationPanelComponent} from '@core/components/notification-panel/component';
import {ApiService} from '@core/services/api/service';
import {Auth} from '@core/services/auth/service';
import {ProjectService} from '@core/services/project/service';
import {UserService} from '@core/services/user/service';
import {Project} from '@shared/entity/project';
import {SharedModule} from '@shared/shared.module';
import {MockComponent} from 'ng2-mock-component';
import {UserPanelComponent} from '../../user-panel/component';
import {NavigationComponent} from '../component';
import {ProjectSelectorComponent} from './component';

const modules: any[] = [BrowserModule, RouterTestingModule, HttpClientModule, BrowserAnimationsModule, SharedModule];

describe('ProjectSelectorComponent', () => {
  let fixture: ComponentFixture<ProjectSelectorComponent>;
  let component: ProjectSelectorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [
        NavigationComponent,
        NotificationPanelComponent,
        ProjectSelectorComponent,
        UserPanelComponent,
        MockComponent({
          selector: 'a',
          inputs: ['routerLink', 'routerLinkActiveOptions'],
        }),
      ],
      providers: [
        {provide: ApiService, useValue: ApiMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Auth, useClass: AuthMockService},
        {
          provide: Router,
          useValue: {
            routerState: {
              snapshot: {url: ''},
            },
          },
        },
        MatDialog,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSelectorComponent);
    component = fixture.componentInstance;
  });

  it(
    'should initialize',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should correctly compare projects basing on their IDs', () => {
    const a: Project = fakeProjects()[0];
    const b: Project = fakeProjects()[1];
    expect(component.areProjectsEqual(a, b)).toBeFalsy();
    expect(component.areProjectsEqual(b, a)).toBeFalsy();

    b.id = a.id;
    expect(component.areProjectsEqual(a, b)).toBeTruthy();
    expect(component.areProjectsEqual(b, a)).toBeTruthy();
  });
});
