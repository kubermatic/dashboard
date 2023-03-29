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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatLegacyDialog as MatDialog} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {RouterStub} from '@test/services/router-stubs';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {RBACComponent} from './component';
import {ClusterService} from '@core/services/cluster';
import {ClusterMockService} from '@test/services/cluster-mock';
import {AppConfigService} from '@app/config.service';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {ClusterServiceAccountMockService} from '@test/services/cluster-service-account-mock';

describe('RBACComponent', () => {
  let fixture: ComponentFixture<RBACComponent>;
  let component: RBACComponent;

  beforeEach(waitForAsync(() => {
    const rbacMock = {
      deleteClusterBinding: jest.fn(),
      deleteBinding: jest.fn(),
    };
    rbacMock.deleteClusterBinding.mockReturnValue(of(null));
    rbacMock.deleteBinding.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [RBACComponent],
      providers: [
        {provide: RBACService, useValue: rbacMock},
        {provide: Router, useClass: RouterStub},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: ClusterServiceAccountService, useClass: ClusterServiceAccountMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        MatDialog,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RBACComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  });

  it('should create the rbac cmp', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
