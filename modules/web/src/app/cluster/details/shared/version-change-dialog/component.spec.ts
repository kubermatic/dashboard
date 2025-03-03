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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ClusterService} from '@core/services/cluster';
import {EndOfLifeService} from '@core/services/eol';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SharedModule} from '@shared/module';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {MachineDeploymentServiceMock} from '@test/services/machine-deployment-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {NotificationMockService} from '@test/services/notification-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {RouterStub} from '@test/services/router-stubs';
import {of} from 'rxjs';
import {VersionChangeDialogComponent} from './component';

describe('ChangeClusterVersionComponent', () => {
  let fixture: ComponentFixture<VersionChangeDialogComponent>;
  let component: VersionChangeDialogComponent;
  let patchClusterSpy: jest.Mock;
  let upgradeClusterMachineDeploymentsSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const clusterServiceMock = {
      patch: jest.fn(),
      upgradeMachineDeployments: jest.fn(),
    };
    patchClusterSpy = clusterServiceMock.patch.mockReturnValue(of(fakeDigitaloceanCluster()));
    upgradeClusterMachineDeploymentsSpy = clusterServiceMock.upgradeMachineDeployments.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [VersionChangeDialogComponent],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {clusterName: 'clustername'}},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ClusterService, useValue: clusterServiceMock},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: MachineDeploymentService, useClass: MachineDeploymentServiceMock},
        {provide: Router, useClass: RouterStub},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: NotificationService, useClass: NotificationMockService},
        GoogleAnalyticsService,
        EndOfLifeService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(VersionChangeDialogComponent);
    component = fixture.componentInstance;
  }));

  it('should create the change cluster version component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  xit('should call patchCluster method from api', fakeAsync(() => {
    component.selectedVersion = 'new version';
    // copy object here since this test modifies the global fake cluster object which impacts other tests otherwise
    component.cluster = JSON.parse(JSON.stringify(fakeDigitaloceanCluster()));
    component.versions = ['1.9.5'];

    fixture.detectChanges();
    // component.changeVersion();
    tick();
    flush();

    expect(patchClusterSpy).toHaveBeenCalledTimes(1);
  }));

  it('should call upgradeClusterMachineDeployments method', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.selectedVersion = 'new-version';
    component.project = fakeProject();

    fixture.detectChanges();
    component.upgradeMachineDeployments();
    tick();
    flush();

    expect(upgradeClusterMachineDeploymentsSpy).toHaveBeenCalled();
  }));
});
