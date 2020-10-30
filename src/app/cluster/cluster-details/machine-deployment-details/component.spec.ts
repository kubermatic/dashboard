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
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {NodeService} from '@app/cluster/services/node.service';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter, fakeSeedDatacenter} from '@app/testing/fake-data/datacenter.fake';
import {machineDeploymentsFake, nodesFake} from '@app/testing/fake-data/node.fake';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {ActivatedRouteStub, RouterStub} from '@app/testing/router-stubs';
import {asyncData} from '@app/testing/services/api-mock.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {AuthMockService} from '@app/testing/services/auth-mock.service';
import {ClusterMockService} from '@app/testing/services/cluster-mock-service';
import {NodeMockService} from '@app/testing/services/node-mock.service';
import {ProjectMockService} from '@app/testing/services/project-mock.service';
import {SettingsMockService} from '@app/testing/services/settings-mock.service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {ApiService} from '@core/services/api/service';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {NotificationService} from '@core/services/notification/service';
import {ProjectService} from '@core/services/project/service';
import {SettingsService} from '@core/services/settings/service';
import {UserService} from '@core/services/user/service';
import {SharedModule} from '@shared/shared.module';
import {MachineDeploymentHealthStatus} from '@shared/utils/health-status/machine-deployment-health-status';
import {NodeListComponent} from '../node-list/component';
import {ClusterPanelComponent} from './cluster-panel/component';
import {MachineDeploymentDetailsComponent} from './component';

describe('MachineDeploymentDetailsComponent', () => {
  let fixture: ComponentFixture<MachineDeploymentDetailsComponent>;
  let component: MachineDeploymentDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  let apiMock;
  let dcMock;

  beforeEach(
    waitForAsync(() => {
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
    })
  );

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
    component.seed = fakeSeedDatacenter();
    component.projectID = fakeProject().id;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: fakeDigitaloceanCluster().id,
      seedDc: fakeSeedDatacenter(),
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
