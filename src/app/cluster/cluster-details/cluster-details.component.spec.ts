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
import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';

import {AppConfigService} from '../../app-config.service';
import {
  ApiService,
  Auth,
  ClusterService,
  DatacenterService,
  NotificationService,
  ProjectService,
  RBACService,
  UserService,
} from '../../core/services';
import {SettingsService} from '../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../testing/fake-data/cluster.fake';
import {
  fakeBindings,
  fakeClusterBindings,
  fakeSimpleBindings,
  fakeSimpleClusterBindings,
} from '../../testing/fake-data/rbac.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../../testing/router-stubs';
import {ApiMockService, asyncData} from '../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../testing/services/auth-mock.service';
import {ClusterMockService} from '../../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {MatDialogMock} from '../../testing/services/mat-dialog-mock';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {NodeMockService} from '../../testing/services/node-mock.service';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {SettingsMockService} from '../../testing/services/settings-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';
import {NodeService} from '../services/node.service';

import {ClusterDetailsComponent} from './cluster-details.component';
import {ClusterSecretsComponent} from './cluster-secrets/cluster-secrets.component';
import {MachineNetworksDisplayComponent} from './machine-networks-display/machine-networks-display.component';
import {MachineDeploymentListComponent} from './machine-deployment-list/machine-deployment-list.component';
import {NodeListComponent} from './node-list/node-list.component';
import {RBACComponent} from './rbac/rbac.component';
import {VersionPickerComponent} from './version-picker/version-picker.component';

describe('ClusterDetailsComponent', () => {
  let fixture: ComponentFixture<ClusterDetailsComponent>;
  let component: ClusterDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async(() => {
    const rbacMock = {
      getClusterBindings: jest.fn(),
      getBindings: jest.fn(),
      deleteClusterBinding: jest.fn(),
      deleteBinding: jest.fn(),
    };
    rbacMock.getClusterBindings.mockReturnValue(asyncData([fakeClusterBindings()]));
    rbacMock.getBindings.mockReturnValue(asyncData([fakeBindings()]));
    rbacMock.deleteClusterBinding.mockReturnValue(of(null));
    rbacMock.deleteBinding.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
      declarations: [
        ClusterDetailsComponent,
        ClusterSecretsComponent,
        NodeListComponent,
        MachineDeploymentListComponent,
        MachineNetworksDisplayComponent,
        VersionPickerComponent,
        RBACComponent,
      ],
      providers: [
        {provide: ApiService, useClass: ApiMockService},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: Router, useClass: RouterStub},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: NodeService, useClass: NodeMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: RBACService, useValue: rbacMock},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MatDialog, useClass: MatDialogMock},
        GoogleAnalyticsService,
        NotificationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: '4k6txp5sq',
      seedDc: 'europe-west3-c',
    };

    fixture.debugElement.query(By.css('.km-spinner'));
    fixture.debugElement.query(By.css('.km-cluster-detail-actions'));
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should get cluster', fakeAsync(() => {
    fixture.detectChanges();

    const expectedCluster = fakeDigitaloceanCluster();
    expectedCluster.creationTimestamp = expect.any(Date);

    tick();
    expect(component.cluster).toEqual(expectedCluster);
  }));

  it('should create simple cluster binding for rbac', () => {
    const simpleClusterBindings = component.createSimpleClusterBinding(fakeClusterBindings());
    expect(simpleClusterBindings).toEqual(fakeSimpleClusterBindings());
  });

  it('should create simple binding for rbac', () => {
    const simpleBindings = component.createSimpleBinding(fakeBindings());
    expect(simpleBindings).toEqual(fakeSimpleBindings());
  });
});
