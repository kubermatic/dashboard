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
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ApplicationService} from '@core/services/application';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {ApplicationServiceMock} from '@test/services/application-mock';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '@test/services/router-stubs';
import {AuthMockService} from '@test/services/auth-mock';
import {ClusterMockService} from '@test/services/cluster-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {MatDialogMock} from '@test/services/mat-dialog-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {NodeMockService} from '@test/services/node-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
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
import {CNIVersionComponent} from './cni-version/component';
import {MachineDeploymentListComponent} from './machine-deployment-list/component';
import {MachineNetworksDisplayComponent} from './machine-networks-display/component';
import {MLAComponent} from './mla/component';
import {NodeListComponent} from './node-list/component';
import {RBACComponent} from './rbac/component';
import {VersionPickerComponent} from '../shared/version-picker/component';
import {nodesFake} from '@test/data/node';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {AddonService} from '@core/services/addon';
import {MachineDeploymentServiceMock} from '@test/services/machine-deployment-mock';
import {AddonServiceMock} from '@test/services/addon-mock';
import {EndOfLifeService} from '@core/services/eol';
import {PresetsService} from '@app/core/services/wizard/presets';
import {PresetServiceMock} from '@test/services/preset-mock';

describe('ClusterDetailsComponent', () => {
  let fixture: ComponentFixture<ClusterDetailsComponent>;
  let component: ClusterDetailsComponent;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(waitForAsync(() => {
    const rbacMock = {
      getClusterBindings: jest.fn(),
      getBindings: jest.fn(),
      deleteClusterBinding: jest.fn(),
      deleteBinding: jest.fn(),
    };
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
        NodeListComponent,
        MachineDeploymentListComponent,
        MachineNetworksDisplayComponent,
        VersionPickerComponent,
        RBACComponent,
        CNIVersionComponent,
        MLAComponent,
      ],
      providers: [
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: Router, useClass: RouterStub},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: UserService, useClass: UserMockService},
        {provide: NodeService, useClass: NodeMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: RBACService, useValue: rbacMock},
        {provide: OPAService, useValue: opaMock},
        {provide: MLAService, useValue: mlaMock},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: MachineDeploymentService, useClass: MachineDeploymentServiceMock},
        {provide: AddonService, useClass: AddonServiceMock},
        {provide: ApplicationService, useClass: ApplicationServiceMock},
        {provide: PresetsService, useClass: PresetServiceMock},
        EndOfLifeService,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {clusterName: '4k6txp5sq'};

    fixture.debugElement.query(By.css('.km-spinner'));
    fixture.debugElement.query(By.css('.cluster-detail-actions'));
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should get cluster', fakeAsync(() => {
    fixture.detectChanges();

    const expectedCluster = fakeDigitaloceanCluster();

    tick();
    expect(component.cluster).toMatchObject({
      ...expectedCluster,
      creationTimestamp: expect.any(Date),
    });
  }));

  it('should get nodes', fakeAsync(() => {
    fixture.detectChanges();

    const expectedNodes = nodesFake();

    tick();
    expect(component.nodes).toMatchObject(expectedNodes.map(node => ({...node, creationTimestamp: expect.any(Date)})));
  }));
});
