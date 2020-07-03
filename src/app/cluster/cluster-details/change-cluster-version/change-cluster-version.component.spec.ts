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

import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {ClusterService, NotificationService, ProjectService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../../testing/services/project-mock.service';

import {ChangeClusterVersionComponent} from './change-cluster-version.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('ChangeClusterVersionComponent', () => {
  let fixture: ComponentFixture<ChangeClusterVersionComponent>;
  let component: ChangeClusterVersionComponent;
  let patchClusterSpy;
  let upgradeClusterMachineDeploymentsSpy;

  beforeEach(async(() => {
    const clusterServiceMock = {
      patch: jest.fn(),
      upgradeMachineDeployments: jest.fn(),
    };
    patchClusterSpy = clusterServiceMock.patch.mockReturnValue(of(fakeDigitaloceanCluster()));
    upgradeClusterMachineDeploymentsSpy = clusterServiceMock.upgradeMachineDeployments.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [ChangeClusterVersionComponent],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: {clusterName: 'clustername'}},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ClusterService, useValue: clusterServiceMock},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: Router, useClass: RouterStub},
        GoogleAnalyticsService,
        NotificationService,
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ChangeClusterVersionComponent);
    component = fixture.componentInstance;
  }));

  it('should create the change cluster version component', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call patchCluster method from api', fakeAsync(() => {
    component.selectedVersion = 'new version';
    // copy object here since this test modifies the global fake cluster object which impacts other tests otherwise
    component.cluster = JSON.parse(JSON.stringify(fakeDigitaloceanCluster()));
    component.datacenter = fakeDigitaloceanDatacenter();
    component.controlPlaneVersions = ['1.9.5'];

    fixture.detectChanges();
    component.changeVersion();
    tick();
    expect(patchClusterSpy).toHaveBeenCalledTimes(1);
  }));

  it('should call upgradeClusterMachineDeployments method', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.selectedVersion = 'new-version';
    component.project = fakeProject();

    fixture.detectChanges();
    component.upgradeMachineDeployments();
    tick();

    expect(upgradeClusterMachineDeploymentsSpy).toHaveBeenCalled();
  }));
});
