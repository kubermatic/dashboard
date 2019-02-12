import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, Auth, DatacenterService, HealthService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {NodeDeploymentHealthStatus} from '../../../shared/utils/health-status/node-deployment-health-status';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {nodeDeploymentsFake, nodesFake} from '../../../testing/fake-data/node.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {ActivatedRouteStub, RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {HealthMockService} from '../../../testing/services/health-mock.service';
import {NodeMockService} from '../../../testing/services/node-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {NodeService} from '../../services/node.service';
import {NodeListComponent} from '../node-list/node-list.component';

import {NodeDeploymentDetailsComponent} from './node-deployment-details.component';

describe('NodeDeploymentDetailsComponent', () => {
  let fixture: ComponentFixture<NodeDeploymentDetailsComponent>;
  let component: NodeDeploymentDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  let apiMock;
  let dcMock;

  beforeEach(async(() => {
    apiMock = jasmine.createSpyObj(
        'ApiService', ['getCluster', 'getNodeDeploymentNodes', 'getNodeDeployment', 'getNodeDeploymentNodesEvents']);
    apiMock.getCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
    apiMock.getNodeDeployment.and.returnValue(asyncData(nodeDeploymentsFake()[0]));
    apiMock.getNodeDeploymentNodes.and.returnValue(asyncData(nodesFake()));
    apiMock.getNodeDeploymentNodesEvents.and.returnValue(asyncData([]));
    dcMock = jasmine.createSpyObj('DatacenterService', ['getDataCenter']);
    dcMock.getDataCenter.and.returnValue(asyncData(fakeDigitaloceanDatacenter()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            HttpClientModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            RouterTestingModule,
            SharedModule,
          ],
          declarations: [
            NodeDeploymentDetailsComponent,
            NodeListComponent,
          ],
          providers: [
            {provide: ApiService, useValue: apiMock},
            {provide: DatacenterService, useValue: dcMock},
            {provide: Auth, useClass: AuthMockService},
            {provide: Router, useClass: RouterStub},
            {provide: ActivatedRoute, useClass: ActivatedRouteStub},
            {provide: HealthService, useClass: HealthMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: NodeService, useClass: NodeMockService},
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
    component.projectID = fakeProject().id;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: component.cluster.id,
      seedDc: component.datacenter.metadata.name,
      nodeDeploymentID: component.nodeDeployment.id,
    };

    spyOn(component, 'isInitialized').and.returnValue(true);

    fixture.debugElement.injector.get(ApiService);
    fixture.detectChanges();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should render go back action button', () => {
    const action = fixture.debugElement.query(By.css('.fa-history'));
    expect(action).not.toBeNull();
  });

  it('should render edit action button', () => {
    const action = fixture.debugElement.query(By.css('.km-icon-edit'));
    expect(action).not.toBeNull();
  });

  it('should render go back action button', () => {
    const action = fixture.debugElement.query(By.css('.fa-trash-o'));
    expect(action).not.toBeNull();
  });

  it('should render cluster name', () => {
    const name = fixture.debugElement.query(By.css('.km-node-deployment-name'));
    expect(name.nativeElement.textContent).toContain(component.nodeDeployment.name);
  });
});
