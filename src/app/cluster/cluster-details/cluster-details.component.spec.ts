import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../app-config.service';
import {ApiService, Auth, ClusterService, DatacenterService, ProjectService, UserService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../testing/fake-data/cluster.fake';
import {nodesFake} from '../../testing/fake-data/node.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../../testing/router-stubs';
import {ApiMockService} from '../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../testing/services/auth-mock.service';
import {ClusterMockService} from '../../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {NodeMockService} from '../../testing/services/node-mock.service';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';
import {NodeService} from '../services/node.service';

import {ClusterDetailsComponent} from './cluster-details.component';
import {ClusterSecretsComponent} from './cluster-secrets/cluster-secrets.component';
import {MachineNetworksDisplayComponent} from './machine-networks-display/machine-networks-dispay.component';
import {NodeDeploymentListComponent} from './node-deployment-list/node-deployment-list.component';
import {NodeListComponent} from './node-list/node-list.component';
import {VersionPickerComponent} from './version-picker/version-picker.component';

describe('ClusterDetailsComponent', () => {
  let fixture: ComponentFixture<ClusterDetailsComponent>;
  let component: ClusterDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async(() => {
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
            ClusterDetailsComponent,
            ClusterSecretsComponent,
            NodeListComponent,
            NodeDeploymentListComponent,
            MachineNetworksDisplayComponent,
            VersionPickerComponent,
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
            MatDialog,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {clusterName: '4k6txp5sq', seedDc: 'europe-west3-c'};

    fixture.debugElement.query(By.css('.km-spinner'));
    fixture.debugElement.query(By.css('.km-cluster-detail-actions'));
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should get cluster', fakeAsync(() => {
       fixture.detectChanges();
       tick();

       const expectedCluster = fakeDigitaloceanCluster();
       // @ts-ignore
       expectedCluster.creationTimestamp = jasmine.any(Date);

       expect(component.cluster).toEqual(expectedCluster, 'should get cluster by api');
       discardPeriodicTasks();
     }));

  it('should get nodes', fakeAsync(() => {
       fixture.detectChanges();
       tick();

       const expectedNodes = nodesFake();
       // @ts-ignore
       expectedNodes[0].creationTimestamp = jasmine.any(Date);
       // @ts-ignore
       expectedNodes[1].creationTimestamp = jasmine.any(Date);

       expect(component.nodes).toEqual(expectedNodes, 'should get nodes by api');

       discardPeriodicTasks();
     }));

  it('should render template after requests', fakeAsync(() => {
       fixture.detectChanges();
       let de = fixture.debugElement.query(By.css('.km-cluster-detail-actions'));
       const spinnerDe = fixture.debugElement.query(By.css('.km-spinner'));

       expect(de).toBeNull('element should not be rendered before requests');
       expect(spinnerDe).not.toBeNull('spinner should be rendered before requests');

       tick();
       fixture.detectChanges();

       de = fixture.debugElement.query(By.css('.km-cluster-detail-actions'));
       expect(de).not.toBeNull('element should be rendered after requests');

       discardPeriodicTasks();
     }));
});
