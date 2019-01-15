import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, Auth, DatacenterService, HealthService, UserService} from '../../../core/services';
import {NodeService} from '../../../core/services/node/node.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {ActivatedRouteStub, RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {HealthMockService} from '../../../testing/services/health-mock.service';
import {NodeMockService} from '../../../testing/services/node-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {NodeListComponent} from '../node-list/node-list.component';

import {NodeDeploymentDetailsComponent} from './node-deployment-details.component';

describe('NodeDeploymentDetailsComponent', () => {
  let fixture: ComponentFixture<NodeDeploymentDetailsComponent>;
  let component: NodeDeploymentDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  let apiMock;
  let dcMock;

  beforeEach(async(() => {
    apiMock = jasmine.createSpyObj('ApiService', ['getCluster']);
    apiMock.getCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
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

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {clusterName: '4k6txp5sq', seedDc: 'europe-west3-c'};
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));
});
