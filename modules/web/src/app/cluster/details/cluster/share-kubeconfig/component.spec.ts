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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {Router, RouterStub, RouterTestingModule} from '@test/services/router-stubs';
import {UserMockService} from '@test/services/user-mock';
import {Auth} from '@core/services/auth/service';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {ShareKubeconfigComponent} from './component';
import {ClusterService} from '@core/services/cluster';
import {AppConfigService} from '@app/config.service';
import {AppConfigMockService} from '@test/services/app-config-mock';

describe('ShareKubeconfigComponent', () => {
  let component: ShareKubeconfigComponent;
  let fixture: ComponentFixture<ShareKubeconfigComponent>;

  beforeEach(waitForAsync(() => {
    const authMock = {authenticated: jest.fn()};
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
      declarations: [ShareKubeconfigComponent],
      providers: [
        {provide: Auth, useValue: authMock},
        {provide: UserService, useClass: UserMockService},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {cluster: fakeDigitaloceanCluster()},
        },
        {provide: MatDialogRef, useValue: {}},
        {provide: Router, useClass: RouterStub},
        {provide: AppConfigService, useClass: AppConfigMockService},
        ClusterService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareKubeconfigComponent);
    component = fixture.componentInstance;
    component.projectID = fakeProject().id;
    component.cluster = fakeDigitaloceanCluster();

    fixture.detectChanges();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });
});
