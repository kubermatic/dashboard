import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../app-config.service';
import {ApiService, Auth, ClusterService, DatacenterService, ProjectService, UserService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeAWSCluster} from '../../testing/fake-data/cluster.fake';
import {fakeHealth} from '../../testing/fake-data/health.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../../testing/router-stubs';
import {ApiMockService, asyncData} from '../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../testing/services/auth-mock.service';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';

import {ClusterListComponent} from './cluster-list.component';
import Spy = jasmine.Spy;

describe('ClusterListComponent', () => {
  let fixture: ComponentFixture<ClusterListComponent>;
  let component: ClusterListComponent;
  let getClustersSpy: Spy;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async(() => {
    const clusterServiceMock = jasmine.createSpyObj('ClusterService', ['clusters', 'health']);
    getClustersSpy = clusterServiceMock.clusters.and.returnValue(asyncData([fakeAWSCluster()]));
    clusterServiceMock.health.and.returnValue(asyncData([fakeHealth()]));

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
            ClusterListComponent,
          ],
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
          ],
        })
        .compileComponents();
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
       // @ts-ignore
       expectedCluster.creationTimestamp = jasmine.any(Date);

       expect(getClustersSpy.and.callThrough()).toHaveBeenCalled();
       expect(component.clusters).toEqual([expectedCluster]);
       discardPeriodicTasks();
     }));

  it('should render cluster list', fakeAsync(() => {
       component.isInitialized = true;
       fixture.detectChanges();

       const de = fixture.debugElement.query(By.css('.km-with-table-header'));

       expect(de).not.toBeNull('list should be rendered');
       discardPeriodicTasks();
     }));

  it('should not render cluster list', fakeAsync(() => {
       fixture.detectChanges();

       const de = fixture.debugElement.query(By.css('.km-no-item'));

       expect(de).toBeNull('list should not be rendered');
       discardPeriodicTasks();
     }));
});
