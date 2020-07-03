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

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, ProjectService, UserService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {RouterStub} from '../../../testing/router-stubs';
import {ApiMockService} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {NodeMockService} from '../../../testing/services/node-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {SettingsMockService} from '../../../testing/services/settings-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {NodeService} from '../../services/node.service';

import {NodeDeploymentListComponent} from './node-deployment-list.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

class MatDialogMock {
  open(): any {
    return {afterClosed: () => of([true])};
  }
}

describe('NodeDeploymentListComponent', () => {
  let fixture: ComponentFixture<NodeDeploymentListComponent>;
  let component: NodeDeploymentListComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [NodeDeploymentListComponent],
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeploymentListComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster details cmp', async(() => {
    expect(component).toBeTruthy();
  }));
});
