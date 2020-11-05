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
import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {
  fakeBindings,
  fakeClusterBindings,
  fakeSimpleBindings,
  fakeSimpleClusterBindings,
} from '@app/testing/fake-data/rbac.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '@app/testing/router-stubs';
import {ApiMockService, asyncData} from '@app/testing/services/api-mock.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {AuthMockService} from '@app/testing/services/auth-mock.service';
import {ClusterMockService} from '@app/testing/services/cluster-mock-service';
import {DatacenterMockService} from '@app/testing/services/datacenter-mock.service';
import {MatDialogMock} from '@app/testing/services/mat-dialog-mock';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {NodeMockService} from '@app/testing/services/node-mock.service';
import {ProjectMockService} from '@app/testing/services/project-mock.service';
import {SettingsMockService} from '@app/testing/services/settings-mock.service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {ApiService} from '@core/services/api/service';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {NotificationService} from '@core/services/notification/service';
import {ProjectService} from '@core/services/project/service';
import {RBACService} from '@core/services/rbac/service';
import {SettingsService} from '@core/services/settings/service';
import {UserService} from '@core/services/user/service';
import {SharedModule} from '@shared/shared.module';
import {of} from 'rxjs';
import {NodeService} from '../services/node.service';
import {ClusterDetailsComponent} from './component';
import {ClusterSecretsComponent} from './cluster-secrets/component';
import {MachineDeploymentListComponent} from './machine-deployment-list/component';
import {MachineNetworksDisplayComponent} from './machine-networks-display/component';
import {NodeListComponent} from './node-list/component';
import {RBACComponent} from './rbac/component';
import {VersionPickerComponent} from './version-picker/component';
import {nodesFake} from '@app/testing/fake-data/node.fake';

describe('ClusterDetailsComponent', () => {
  let fixture: ComponentFixture<ClusterDetailsComponent>;
  let component: ClusterDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(
    waitForAsync(() => {
      const rbacMock = {
        getClusterBindings: jest.fn(),
        getBindings: jest.fn(),
        deleteClusterBinding: jest.fn(),
        deleteBinding: jest.fn(),
      };
      rbacMock.getClusterBindings.mockReturnValue(asyncData([fakeClusterBindings()]));
      rbacMock.getBindings.mockReturnValue(asyncData([fakeBindings()]));
      rbacMock.deleteClusterBinding.mockReturnValue(of(null));
      rbacMock.deleteBinding.mockReturnValue(of(null));

      TestBed.configureTestingModule({
        imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule],
        declarations: [
          ClusterDetailsComponent,
          ClusterSecretsComponent,
          NodeListComponent,
          MachineDeploymentListComponent,
          MachineNetworksDisplayComponent,
          VersionPickerComponent,
          RBACComponent,
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
          {provide: SettingsService, useClass: SettingsMockService},
          {provide: RBACService, useValue: rbacMock},
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: MatDialog, useClass: MatDialogMock},
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      clusterName: '4k6txp5sq',
      seedDc: 'europe-west3-c',
    };

    fixture.debugElement.query(By.css('.km-spinner'));
    fixture.debugElement.query(By.css('.km-cluster-detail-actions'));
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should get cluster', fakeAsync(() => {
    fixture.detectChanges();

    const expectedCluster = fakeDigitaloceanCluster();
    expectedCluster.creationTimestamp = expect.any(Date);

    tick();
    expect(component.cluster).toEqual(expectedCluster);
  }));

  it('should get nodes', fakeAsync(() => {
    fixture.detectChanges();

    const expectedNodes = nodesFake();
    expectedNodes[0].creationTimestamp = expect.any(Date);
    expectedNodes[1].creationTimestamp = expect.any(Date);

    tick();
    expect(component.nodes).toEqual(expectedNodes);
  }));

  it('should create simple cluster binding for rbac', () => {
    const simpleClusterBindings = component.createSimpleClusterBinding(fakeClusterBindings());
    expect(simpleClusterBindings).toEqual(fakeSimpleClusterBindings());
  });

  it('should create simple binding for rbac', () => {
    const simpleBindings = component.createSimpleBinding(fakeBindings());
    expect(simpleBindings).toEqual(fakeSimpleBindings());
  });
});
