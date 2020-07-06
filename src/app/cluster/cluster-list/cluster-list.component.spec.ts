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
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';

import {AppConfigService} from '../../app-config.service';
import {ApiService, Auth, ClusterService, DatacenterService, ProjectService, UserService} from '../../core/services';
import {SettingsService} from '../../core/services/settings/settings.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeAWSCluster} from '../../testing/fake-data/cluster.fake';
import {fakeHealth} from '../../testing/fake-data/health.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../../testing/router-stubs';
import {ApiMockService, asyncData} from '../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../testing/services/auth-mock.service';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {SettingsMockService} from '../../testing/services/settings-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';

import {ClusterListComponent} from './cluster-list.component';

describe('ClusterListComponent', () => {
  let fixture: ComponentFixture<ClusterListComponent>;
  let component: ClusterListComponent;
  let getClustersSpy;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async(() => {
    const clusterServiceMock = {clusters: jest.fn(), health: jest.fn()};
    getClustersSpy = clusterServiceMock.clusters.mockReturnValue(asyncData([fakeAWSCluster()]));
    clusterServiceMock.health.mockReturnValue(asyncData([fakeHealth()]));

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
      declarations: [ClusterListComponent],
      providers: [
        {provide: ApiService, useValue: ApiMockService},
        {provide: ClusterService, useValue: clusterServiceMock},
        {provide: Auth, useClass: AuthMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: Router, useClass: RouterStub},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterListComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {projectID: '4k6txp5sq'};
  });

  it('should create the cluster list cmp', fakeAsync(() => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    discardPeriodicTasks();
  }));

  it('should get cluster list', fakeAsync(() => {
    fixture.detectChanges();
    tick(1);

    const expectedCluster = fakeAWSCluster();
    expectedCluster.creationTimestamp = expect.any(Date);

    expect(getClustersSpy).toHaveBeenCalled();
    expect(component.clusters).toEqual([expectedCluster]);
    discardPeriodicTasks();
  }));

  it('should render cluster list', fakeAsync(() => {
    component.isInitialized = true;
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.km-with-table-header'));

    expect(de).not.toBeNull();
    discardPeriodicTasks();
  }));

  it('should not render cluster list', fakeAsync(() => {
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.km-no-item'));

    expect(de).toBeNull();
    discardPeriodicTasks();
  }));
});
