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
import {MatLegacyDialog as MatDialog} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {RouterStub} from '@test/services/router-stubs';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {NodeMockService} from '@test/services/node-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {NodeService} from '@core/services/node';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {MachineDeploymentListComponent} from './component';
import {ClusterService} from '@core/services/cluster';
import {ClusterMockService} from '@test/services/cluster-mock';

class MatDialogMock {
  open(): any {
    return {afterClosed: () => of([true])};
  }
}

describe('MachineDeploymentListComponent', () => {
  let fixture: ComponentFixture<MachineDeploymentListComponent>;
  let component: MachineDeploymentListComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule],
      declarations: [MachineDeploymentListComponent],
      providers: [
        {provide: NodeService, useClass: NodeMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: Router, useClass: RouterStub},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: ClusterService, useClass: ClusterMockService},
        GoogleAnalyticsService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineDeploymentListComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster details cmp', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
