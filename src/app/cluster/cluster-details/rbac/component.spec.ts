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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {RouterStub} from '@app/testing/router-stubs';
import {NotificationService} from '@core/services/notification/service';
import {RBACService} from '@core/services/rbac/service';
import {SharedModule} from '@shared/shared.module';
import {of} from 'rxjs';
import {RBACComponent} from './component';
import {ClusterService} from '@core/services/cluster/service';
import {ClusterMockService} from '@app/testing/services/cluster-mock-service';
import {AppConfigService} from '@app/config.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {
  fakeBindings,
  fakeClusterBindings,
  fakeSimpleBindings,
  fakeSimpleClusterBindings,
} from '@app/testing/fake-data/rbac.fake';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('RBACComponent', () => {
  let fixture: ComponentFixture<RBACComponent>;
  let component: RBACComponent;

  beforeEach(
    waitForAsync(() => {
      const rbacMock = {
        deleteClusterBinding: jest.fn(),
        deleteBinding: jest.fn(),
      };
      rbacMock.deleteClusterBinding.mockReturnValue(of(null));
      rbacMock.deleteBinding.mockReturnValue(of(null));

      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [RBACComponent],
        providers: [
          {provide: RBACService, useValue: rbacMock},
          {provide: Router, useClass: RouterStub},
          {provide: ClusterService, useClass: ClusterMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          MatDialog,
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RBACComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  });

  it(
    'should create the rbac cmp',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should create simple cluster binding for rbac', () => {
    const simpleClusterBindings = component.createSimpleClusterBinding(fakeClusterBindings());
    expect(simpleClusterBindings).toEqual(fakeSimpleClusterBindings());
  });

  it('should create simple binding for rbac', () => {
    const simpleBindings = component.createSimpleBinding(fakeBindings());
    expect(simpleBindings).toEqual(fakeSimpleBindings());
  });
});
