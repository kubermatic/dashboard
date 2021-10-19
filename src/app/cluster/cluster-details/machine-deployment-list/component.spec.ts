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
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {RouterStub} from '@app/testing/router-stubs';
import {ApiMockService} from '@app/testing/services/api-mock';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {NodeMockService} from '@app/testing/services/node-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {SettingsMockService} from '@app/testing/services/settings-mock';
import {UserMockService} from '@app/testing/services/user-mock';
import {ApiService} from '@core/services/api';
import {NodeService} from '@core/services/node';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {MachineDeploymentListComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

class MatDialogMock {
  open(): any {
    return {afterClosed: () => of([true])};
  }
}

describe('MachineDeploymentListComponent', () => {
  let fixture: ComponentFixture<MachineDeploymentListComponent>;
  let component: MachineDeploymentListComponent;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [MachineDeploymentListComponent],
        providers: [
          {provide: ApiService, useClass: ApiMockService},
          {provide: NodeService, useClass: NodeMockService},
          {provide: UserService, useClass: UserMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: MatDialog, useClass: MatDialogMock},
          {provide: Router, useClass: RouterStub},
          {provide: SettingsService, useClass: SettingsMockService},
          GoogleAnalyticsService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineDeploymentListComponent);
    component = fixture.componentInstance;
  });

  it(
    'should create the cluster details cmp',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );
});
