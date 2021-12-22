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

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster';
import {ActivatedRouteStub, RouterStub} from '@app/testing/router-stubs';
import {ApiMockService} from '@app/testing/services/api-mock';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {AuthMockService} from '@app/testing/services/auth-mock';
import {ClusterMockService} from '@app/testing/services/cluster-mock';
import {DatacenterMockService} from '@app/testing/services/datacenter-mock';
import {NodeMockService} from '@app/testing/services/node-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {UserMockService} from '@app/testing/services/user-mock';
import {ApiService} from '@core/services/api';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {EndOfLifeService} from '@core/services/eol';
import {NodeService} from '@core/services/node';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {ClusterSecretsComponent} from '../cluster-secrets/component';
import {MachineDeploymentListComponent} from '../machine-deployment-list/component';
import {MachineNetworksDisplayComponent} from '../machine-networks-display/component';
import {NodeListComponent} from '../node-list/component';

import {VersionPickerComponent} from './component';

describe('VersionPickerComponent', () => {
  let fixture: ComponentFixture<VersionPickerComponent>;
  let component: VersionPickerComponent;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
        declarations: [
          VersionPickerComponent,
          ClusterSecretsComponent,
          NodeListComponent,
          MachineDeploymentListComponent,
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
          EndOfLifeService,
        ],
        teardown: {destroyAfterEach: false},
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionPickerComponent);
    component = fixture.componentInstance;

    component.cluster = fakeDigitaloceanCluster();
    component.isClusterRunning = true;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: '4k6txp5sq',
      seedDc: 'europe-west3-c',
    };

    fixture.debugElement.query(By.css('.km-spinner'));
    fixture.debugElement.query(By.css('.km-cluster-detail-actions'));
  });

  it(
    'should initialize',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

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
    expect(component.updatesAvailable).toEqual(true);
    expect(component.downgradesAvailable).toEqual(false);
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
    expect(component.updatesAvailable).toEqual(false);
    expect(component.downgradesAvailable).toEqual(false);
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
    expect(component.updatesAvailable).toEqual(false);
    expect(component.downgradesAvailable).toEqual(true);
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
    expect(component.updatesAvailable).toEqual(true);
    expect(component.downgradesAvailable).toEqual(true);
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
