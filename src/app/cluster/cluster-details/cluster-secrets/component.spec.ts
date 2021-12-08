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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {fakeHealth, fakeHealthFailed, fakeHealthProvisioning} from '@app/testing/fake-data/health';
import {RouterStub} from '@app/testing/router-stubs';
import {asyncData} from '@app/testing/services/api-mock';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {ClusterMockService} from '@app/testing/services/cluster-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {UserMockService} from '@app/testing/services/user-mock';
import {ClusterService} from '@core/services/cluster';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {HealthState, HealthType} from '@shared/entity/health';
import {SharedModule} from '@shared/module';
import {ClusterSecretsComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('ClusterSecretsComponent', () => {
  let fixture: ComponentFixture<ClusterSecretsComponent>;
  let component: ClusterSecretsComponent;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {getClusterHealth: jest.fn()};
      apiMock.getClusterHealth.mockReturnValue(asyncData([fakeHealth()]));

      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [ClusterSecretsComponent],
        providers: [
          {provide: ClusterService, useClass: ClusterMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: Router, useClass: RouterStub},
          {provide: UserService, useClass: UserMockService},
          MatDialog,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterSecretsComponent);
    component = fixture.componentInstance;
  });

  it(
    'should initialize',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should set icon class `km-icon-running`', () => {
    expect(component.getIconClass(HealthState.up)).toBe('km-icon-running');
  });

  it('should set icon class `km-icon-failed`', () => {
    component.health = fakeHealthFailed();
    expect(component.getIconClass(HealthState.down)).toBe('km-icon-failed');
  });

  it('should set icon class `km-icon-pending km-info`', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getIconClass(HealthState.provisioning)).toBe('km-icon-pending km-info');
  });

  it('should set correct icon for controllers', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getIcon(HealthType.Apiserver)).toBe('km-icon-running');
    expect(component.getIcon(HealthType.Controller)).toBe('km-icon-running');
    expect(component.getIcon(HealthType.Etcd)).toBe('km-icon-pending km-info');
    expect(component.getIcon(HealthType.Scheduler)).toBe('km-icon-pending km-info');
    expect(component.getIcon(HealthType.MachineController)).toBe('km-icon-running');
    expect(component.getIcon(HealthType.UserClusterControllerManager)).toBe('km-icon-pending km-info');
  });

  it('should set health status `Running`', () => {
    expect(component.getHealthStatus(HealthState.up)).toBe('Running');
  });

  it('should set health status `Failed`', () => {
    component.health = fakeHealthFailed();
    expect(component.getHealthStatus(HealthState.down)).toBe('Failed');
  });

  it('should set health status `Pending`', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getHealthStatus(HealthState.provisioning)).toBe('Pending');
  });

  it('should set correct status for controllers', () => {
    component.health = fakeHealthProvisioning();
    expect(component.getStatus(HealthType.Apiserver)).toBe('Running');
    expect(component.getStatus(HealthType.Controller)).toBe('Running');
    expect(component.getStatus(HealthType.Etcd)).toBe('Pending');
    expect(component.getStatus(HealthType.Scheduler)).toBe('Pending');
    expect(component.getStatus(HealthType.MachineController)).toBe('Running');
    expect(component.getStatus(HealthType.UserClusterControllerManager)).toBe('Pending');
  });
});
