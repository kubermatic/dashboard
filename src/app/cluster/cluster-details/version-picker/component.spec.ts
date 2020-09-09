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
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, Auth, ClusterService, DatacenterService, ProjectService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeSeedDatacenter} from '../../../testing/fake-data/datacenter.fake';
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
import {MachineNetworksDisplayComponent} from '../machine-networks-display/machine-networks-display.component';
import {MachineDeploymentListComponent} from '../machine-deployment-list/machine-deployment-list.component';
import {NodeListComponent} from '../node-list/node-list.component';

import {VersionPickerComponent} from './component';

describe('VersionPickerComponent', () => {
  let fixture: ComponentFixture<VersionPickerComponent>;
  let component: VersionPickerComponent;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async(() => {
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
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionPickerComponent);
    component = fixture.componentInstance;

    component.cluster = fakeDigitaloceanCluster();
    component.seed = fakeSeedDatacenter();
    component.isClusterRunning = true;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: '4k6txp5sq',
      seedDc: 'europe-west3-c',
    };

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
