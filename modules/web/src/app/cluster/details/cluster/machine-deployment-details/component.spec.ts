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
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService } from '@app/config.service';
import { GoogleAnalyticsService } from '@app/google-analytics.service';
import { Auth } from '@core/services/auth/service';
import { ClusterService } from '@core/services/cluster';
import { DatacenterService } from '@core/services/datacenter';
import { MachineDeploymentService } from '@core/services/machine-deployment';
import { NodeService } from '@core/services/node';
import { NotificationService } from '@core/services/notification';
import { ProjectService } from '@core/services/project';
import { SettingsService } from '@core/services/settings';
import { UserService } from '@core/services/user';
import { SharedModule } from '@shared/module';
import { getMachineDeploymentHealthStatus } from '@shared/utils/health-status';
import { fakeDigitaloceanCluster } from '@test/data/cluster';
import { fakeDigitaloceanDatacenter } from '@test/data/datacenter';
import { machineDeploymentsFake, nodesFake } from '@test/data/node';
import { fakeProject } from '@test/data/project';
import { AppConfigMockService } from '@test/services/app-config-mock';
import { AuthMockService } from '@test/services/auth-mock';
import { ClusterMockService } from '@test/services/cluster-mock';
import { NodeMockService } from '@test/services/node-mock';
import { ProjectMockService } from '@test/services/project-mock';
import { ActivatedRouteStub, RouterStub } from '@test/services/router-stubs';
import { SettingsMockService } from '@test/services/settings-mock';
import { UserMockService } from '@test/services/user-mock';
import { ClusterPanelComponent } from '../../shared/cluster-panel/component';
import { NodeListComponent } from '../node-list/component';
import { MachineDeploymentDetailsComponent } from './component';

describe('MachineDeploymentDetailsComponent', () => {
  let fixture: ComponentFixture<MachineDeploymentDetailsComponent>;
  let component: MachineDeploymentDetailsComponent;
  let activatedRoute: ActivatedRouteStub;
  let dcMock;

  beforeEach(waitForAsync(() => {
    dcMock = {getDatacenter: jest.fn()};

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [MachineDeploymentDetailsComponent, NodeListComponent, ClusterPanelComponent],
      providers: [
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: DatacenterService, useValue: dcMock},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: Router, useClass: RouterStub},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: NodeService, useClass: NodeMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        MachineDeploymentService,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineDeploymentDetailsComponent);
    component = fixture.componentInstance;

    component.machineDeployment = machineDeploymentsFake()[0];
    component.machineDeploymentHealthStatus = getMachineDeploymentHealthStatus(component.machineDeployment);
    component.nodes = nodesFake();
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.projectID = fakeProject().id;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: fakeDigitaloceanCluster().id,
      machineDeploymentID: machineDeploymentsFake()[0].id,
      projectID: fakeProject().id,
    };

    fixture.detectChanges();
  });

  it('should initialize', () => {
    jest.spyOn(component, 'isInitialized').mockReturnValue(true);
    expect(component).toBeTruthy();
  });
});
