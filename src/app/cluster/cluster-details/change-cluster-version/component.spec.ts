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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {fakeSeedDatacenter} from '@app/testing/fake-data/datacenter.fake';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {RouterStub} from '@app/testing/router-stubs';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@app/testing/services/project-mock.service';
import {ClusterService} from '@core/services/cluster/service';
import {NotificationService} from '@core/services/notification/service';
import {ProjectService} from '@core/services/project/service';
import {SharedModule} from '@shared/shared.module';
import {of} from 'rxjs';
import {ChangeClusterVersionComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('ChangeClusterVersionComponent', () => {
  let fixture: ComponentFixture<ChangeClusterVersionComponent>;
  let component: ChangeClusterVersionComponent;
  let patchClusterSpy;
  let upgradeClusterMachineDeploymentsSpy;

  beforeEach(
    waitForAsync(() => {
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
          {provide: AppConfigService, useClass: AppConfigMockService},
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(ChangeClusterVersionComponent);
      component = fixture.componentInstance;
    })
  );

  it(
    'should create the change cluster version component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should call patchCluster method from api', fakeAsync(() => {
    component.selectedVersion = 'new version';
    // copy object here since this test modifies the global fake cluster object which impacts other tests otherwise
    component.cluster = JSON.parse(JSON.stringify(fakeDigitaloceanCluster()));
    component.seed = fakeSeedDatacenter();
    component.controlPlaneVersions = ['1.9.5'];

    fixture.detectChanges();
    component.changeVersion();
    tick();
    expect(patchClusterSpy).toHaveBeenCalledTimes(1);
  }));

  it('should call upgradeClusterMachineDeployments method', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.seed = fakeSeedDatacenter();
    component.selectedVersion = 'new-version';
    component.project = fakeProject();

    fixture.detectChanges();
    component.upgradeMachineDeployments();
    tick();

    expect(upgradeClusterMachineDeploymentsSpy).toHaveBeenCalled();
  }));
});
