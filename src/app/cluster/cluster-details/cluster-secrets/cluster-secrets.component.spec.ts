import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, ProjectService, UserService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeHealth, fakeHealthFailed, fakeHealthProvisioning} from '../../../testing/fake-data/health.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';

import {ClusterSecretsComponent} from './cluster-secrets.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('ClusterSecretsComponent', () => {
  let fixture: ComponentFixture<ClusterSecretsComponent>;
  let component: ClusterSecretsComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getClusterHealth']);
    apiMock.getClusterHealth.and.returnValue(asyncData([fakeHealth()]));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ClusterSecretsComponent,
          ],
          providers: [
            {provide: ApiService, useValue: apiMock},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: Router, useClass: RouterStub},
            {provide: UserService, useClass: UserMockService},
            MatDialog,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterSecretsComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster secrets cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should set variable expand', () => {
    component.isExpand(true);
    expect(component.expand).toBeTruthy();

    component.isExpand(false);
    expect(component.expand).toBeFalsy();
  });

  it('should set icon class `km-icon-running`', () => {
    expect(component.getIconClass(true)).toBe('km-icon-running');
  });

  it('should set icon class `km-icon-failed`', () => {
    component.health = fakeHealthFailed();
    expect(component.getIconClass(false)).toBe('km-icon-failed');
  });

  it('should set icon class `fa fa-circle`', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getIconClass(false)).toBe('fa fa-circle');
  });

  it('should set correct icon for controllers', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getIcon('apiserver')).toBe('km-icon-running');
    expect(component.getIcon('controller')).toBe('km-icon-running');
    expect(component.getIcon('etcd')).toBe('fa fa-circle');
    expect(component.getIcon('scheduler')).toBe('fa fa-circle');
    expect(component.getIcon('machineController')).toBe('km-icon-running');
    expect(component.getIcon('userClusterControllerManager')).toBe('fa fa-circle');
    expect(component.getIcon('test-controller')).toBe('');
  });

  it('should set health status `Running`', () => {
    expect(component.getHealthStatus(true)).toBe('Running');
  });

  it('should set health status `Failed`', () => {
    component.health = fakeHealthFailed();
    expect(component.getHealthStatus(false)).toBe('Failed');
  });

  it('should set health status `Pending`', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getHealthStatus(false)).toBe('Pending');
  });

  it('should set correct status for controllers', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getStatus('apiserver')).toBe('Running');
    expect(component.getStatus('controller')).toBe('Running');
    expect(component.getStatus('etcd')).toBe('Pending');
    expect(component.getStatus('scheduler')).toBe('Pending');
    expect(component.getStatus('machineController')).toBe('Running');
    expect(component.getStatus('userClusterControllerManager')).toBe('Pending');
    expect(component.getStatus('test-controller')).toBe('');
  });
});
