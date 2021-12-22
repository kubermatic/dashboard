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
import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster';
import {fakeBindings, fakeClusterBindings} from '@app/testing/fake-data/rbac';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '@app/testing/router-stubs';
import {ApiMockService, asyncData} from '@app/testing/services/api-mock';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {AuthMockService} from '@app/testing/services/auth-mock';
import {ClusterMockService} from '@app/testing/services/cluster-mock';
import {DatacenterMockService} from '@app/testing/services/datacenter-mock';
import {MatDialogMock} from '@app/testing/services/mat-dialog-mock';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {NodeMockService} from '@app/testing/services/node-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {SettingsMockService} from '@app/testing/services/settings-mock';
import {UserMockService} from '@app/testing/services/user-mock';
import {ApiService} from '@core/services/api';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {MLAService} from '@core/services/mla';
import {NodeService} from '@core/services/node';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {ProjectService} from '@core/services/project';
import {RBACService} from '@core/services/rbac';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {ClusterDetailsComponent} from './component';
import {ClusterSecretsComponent} from './cluster-secrets/component';
import {CNIVersionComponent} from './cni-version/component';
import {MachineDeploymentListComponent} from './machine-deployment-list/component';
import {MachineNetworksDisplayComponent} from './machine-networks-display/component';
import {MLAComponent} from './mla/component';
import {NodeListComponent} from './node-list/component';
import {RBACComponent} from './rbac/component';
import {VersionPickerComponent} from '../shared/version-picker/component';
import {nodesFake} from '@app/testing/fake-data/node';

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

      const opaMock = {constraints: jest.fn(), gatekeeperConfig: jest.fn()};
      opaMock.constraints.mockReturnValue(of([]));
      opaMock.gatekeeperConfig.mockReturnValue(of(null));

      const mlaMock = {alertmanagerConfig: jest.fn(), ruleGroups: jest.fn()};
      mlaMock.alertmanagerConfig.mockReturnValue(of(null));
      mlaMock.ruleGroups.mockReturnValue(of(null));

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
          CNIVersionComponent,
          MLAComponent,
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
          {provide: OPAService, useValue: opaMock},
          {provide: MLAService, useValue: mlaMock},
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: MatDialog, useClass: MatDialogMock},
          GoogleAnalyticsService,
          NotificationService,
        ],
        teardown: {destroyAfterEach: false},
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {clusterName: '4k6txp5sq'};

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
});
