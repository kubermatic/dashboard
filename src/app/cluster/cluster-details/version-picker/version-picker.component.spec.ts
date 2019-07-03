import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, Auth, ClusterService, DatacenterService, ProjectService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {ActivatedRouteStub, RouterStub} from '../../../testing/router-stubs';
import {ApiMockService} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {ClusterMockService} from '../../../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';
import {NodeMockService} from '../../../testing/services/node-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {NodeService} from '../../services/node.service';
import {ClusterSecretsComponent} from '../cluster-secrets/cluster-secrets.component';
import {MachineNetworksDisplayComponent} from '../machine-networks-display/machine-networks-dispay.component';
import {NodeDeploymentListComponent} from '../node-deployment-list/node-deployment-list.component';
import {NodeListComponent} from '../node-list/node-list.component';

import {VersionPickerComponent} from './version-picker.component';

describe('VersionPickerComponent', () => {
  let fixture: ComponentFixture<VersionPickerComponent>;
  let component: VersionPickerComponent;
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
            VersionPickerComponent,
            ClusterSecretsComponent,
            NodeListComponent,
            NodeDeploymentListComponent,
            MachineNetworksDisplayComponent,
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
    fixture = TestBed.createComponent(VersionPickerComponent);
    component = fixture.componentInstance;

    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.isClusterRunning = true;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {clusterName: '4k6txp5sq', seedDc: 'europe-west3-c'};

    fixture.debugElement.query(By.css('.km-spinner'));
    fixture.debugElement.query(By.css('.km-cluster-detail-actions'));
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should show upgrade link', fakeAsync(() => {
       component.upgrades = [
         {
           version: '1.8.5',
           default: false,
         },
         {
           version: '1.8.6',
           default: false,
         },
       ];
       fixture.detectChanges();
       tick();
       expect(component.updatesAvailable).toEqual(true, 'Updates should be available');
       expect(component.downgradesAvailable).toEqual(false, 'Downgrades should not be available');
       discardPeriodicTasks();
     }));

  it('should not show upgrade or downgrade link', fakeAsync(() => {
       component.upgrades = [
         {
           version: '1.8.5',
           default: false,
         },
       ];
       fixture.detectChanges();
       tick();
       expect(component.updatesAvailable).toEqual(false, 'Updates should not be available');
       expect(component.downgradesAvailable).toEqual(false, 'Downgrades should not be available');
       discardPeriodicTasks();
     }));

  it('should show downgrade link', fakeAsync(() => {
       component.upgrades = [
         {
           version: '1.8.5',
           default: false,
         },
         {
           version: '1.8.4',
           default: false,
         },
       ];
       fixture.detectChanges();
       tick();
       expect(component.updatesAvailable).toEqual(false, 'Updates should not be available');
       expect(component.downgradesAvailable).toEqual(true, 'Downgrades should be available');
       discardPeriodicTasks();
     }));

  it('should show downgrade and update link', fakeAsync(() => {
       component.upgrades = [
         {
           version: '1.8.5',
           default: false,
         },
         {
           version: '1.8.4',
           default: false,
         },
         {
           version: '1.8.6',
           default: false,
         },
       ];
       fixture.detectChanges();
       tick();
       expect(component.updatesAvailable).toEqual(true, 'Updates should be available');
       expect(component.downgradesAvailable).toEqual(true, 'Downgrades should be available');
       discardPeriodicTasks();
     }));

  it('should filter restricted versions', fakeAsync(() => {
       component.upgrades = [
         {
           version: '1.8.5',
           default: false,
         },
         {
           version: '1.8.4',
           default: false,
           restrictedByKubeletVersion: true,
         },
         {
           version: '1.8.6',
           default: false,
           restrictedByKubeletVersion: true,
         },
       ];
       fixture.detectChanges();
       tick();
       expect(component.updatesAvailable).toBeFalsy();
       expect(component.downgradesAvailable).toBeFalsy();
       expect(component.someUpgradesRestrictedByKubeletVersion).toBeTruthy();
       discardPeriodicTasks();
     }));

  it('should not filter non-restricted versions', fakeAsync(() => {
       component.upgrades = [
         {
           version: '1.8.5',
           default: false,
         },
         {
           version: '1.8.4',
           default: false,
         },
         {
           version: '1.8.6',
           default: false,
         },
       ];
       fixture.detectChanges();
       tick();
       expect(component.updatesAvailable).toBeTruthy();
       expect(component.downgradesAvailable).toBeTruthy();
       expect(component.someUpgradesRestrictedByKubeletVersion).toBeFalsy();
       discardPeriodicTasks();
     }));
});
