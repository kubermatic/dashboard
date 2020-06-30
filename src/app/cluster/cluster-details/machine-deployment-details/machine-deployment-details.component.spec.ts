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
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConfigService} from '../../../app-config.service';
import {
  ApiService,
  Auth,
  ClusterService,
  DatacenterService,
  NotificationService,
  ProjectService,
  UserService,
} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {MachineDeploymentHealthStatus} from '../../../shared/utils/health-status/machine-deployment-health-status';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeBringyourownSeedDatacenter, fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {machineDeploymentsFake, nodesFake} from '../../../testing/fake-data/node.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {ActivatedRouteStub, RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {ClusterMockService} from '../../../testing/services/cluster-mock-service';
import {NodeMockService} from '../../../testing/services/node-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {SettingsMockService} from '../../../testing/services/settings-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {NodeService} from '../../services/node.service';
import {NodeListComponent} from '../node-list/node-list.component';

import {ClusterPanelComponent} from './cluster-panel/cluster-panel.component';
import {MachineDeploymentDetailsComponent} from './machine-deployment-details.component';

describe('MachineDeploymentDetailsComponent', () => {
  let fixture: ComponentFixture<MachineDeploymentDetailsComponent>;
  let component: MachineDeploymentDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  let apiMock;
  let dcMock;

  beforeEach(async(() => {
    apiMock = {
      getMachineDeploymentNodes: jest.fn(),
      getMachineDeployment: jest.fn(),
      getMachineDeploymentNodesEvents: jest.fn(),
    };
    apiMock.getMachineDeployment.mockReturnValue(asyncData(machineDeploymentsFake()[0]));
    apiMock.getMachineDeploymentNodes.mockReturnValue(asyncData(nodesFake()));
    apiMock.getMachineDeploymentNodesEvents.mockReturnValue(asyncData([]));
    dcMock = {getDatacenter: jest.fn()};
    dcMock.getDatacenter.mockReturnValue(asyncData(fakeDigitaloceanDatacenter()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
      declarations: [MachineDeploymentDetailsComponent, NodeListComponent, ClusterPanelComponent],
      providers: [
        {provide: ApiService, useValue: apiMock},
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
        GoogleAnalyticsService,
        NotificationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineDeploymentDetailsComponent);
    component = fixture.componentInstance;

    component.machineDeployment = machineDeploymentsFake()[0];
    component.machineDeploymentHealthStatus = MachineDeploymentHealthStatus.getHealthStatus(
      component.machineDeployment
    );
    component.nodes = nodesFake();
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.seedDatacenter = fakeBringyourownSeedDatacenter();
    component.projectID = fakeProject().id;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: fakeDigitaloceanCluster().id,
      seedDc: fakeDigitaloceanDatacenter().spec.seed,
      machineDeploymentID: machineDeploymentsFake()[0].id,
      projectID: fakeProject().id,
    };

    fixture.detectChanges();
    fixture.debugElement.injector.get(ApiService);
  });

  it('should initialize', () => {
    jest.spyOn(component, 'isInitialized').mockReturnValue(true);
    expect(component).toBeTruthy();
  });
});
