import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, Auth, ClusterService, DatacenterService, ProjectService, UserService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {NodeDeploymentHealthStatus} from '../../../shared/utils/health-status/node-deployment-health-status';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeBringyourownSeedDatacenter, fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {nodeDeploymentsFake, nodesFake} from '../../../testing/fake-data/node.fake';
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
import {NodeDeploymentDetailsComponent} from './node-deployment-details.component';

describe('NodeDeploymentDetailsComponent', () => {
  let fixture: ComponentFixture<NodeDeploymentDetailsComponent>;
  let component: NodeDeploymentDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  let apiMock;
  let dcMock;

  beforeEach(async(() => {
    apiMock = {
      'getNodeDeploymentNodes': jest.fn(),
      'getNodeDeployment': jest.fn(),
      'getNodeDeploymentNodesEvents': jest.fn()
    };
    apiMock.getNodeDeployment.mockReturnValue(asyncData(nodeDeploymentsFake()[0]));
    apiMock.getNodeDeploymentNodes.mockReturnValue(asyncData(nodesFake()));
    apiMock.getNodeDeploymentNodesEvents.mockReturnValue(asyncData([]));
    dcMock = {'getDataCenter': jest.fn()};
    dcMock.getDataCenter.mockReturnValue(asyncData(fakeDigitaloceanDatacenter()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            HttpClientModule,
            BrowserAnimationsModule,
            RouterTestingModule,
            SharedModule,
          ],
          declarations: [
            NodeDeploymentDetailsComponent,
            NodeListComponent,
            ClusterPanelComponent,
          ],
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
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeploymentDetailsComponent);
    component = fixture.componentInstance;

    component.nodeDeployment = nodeDeploymentsFake()[0];
    component.nodeDeploymentHealthStatus = NodeDeploymentHealthStatus.getHealthStatus(component.nodeDeployment);
    component.nodes = nodesFake();
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.seedDatacenter = fakeBringyourownSeedDatacenter();
    component.projectID = fakeProject().id;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: fakeDigitaloceanCluster().id,
      seedDc: fakeDigitaloceanDatacenter().spec.seed,
      nodeDeploymentID: nodeDeploymentsFake()[0].id,
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
