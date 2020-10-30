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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {ClusterMockService} from '@app/testing/services/cluster-mock-service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {ClusterService} from '@core/services/cluster/service';
import {NotificationService} from '@core/services/notification/service';
import {UserService} from '@core/services/user/service';
import {SharedModule} from '@shared/shared.module';
import {EditSSHKeysComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('EditSSHKeysComponent', () => {
  let fixture: ComponentFixture<EditSSHKeysComponent>;
  let component: EditSSHKeysComponent;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [EditSSHKeysComponent],
        providers: [
          {provide: ClusterService, useClass: ClusterMockService},
          {provide: UserService, useClass: UserMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          MatDialog,
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(EditSSHKeysComponent);
      component = fixture.componentInstance;
    })
  );

  it(
    'should create the edit sshkeys component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );
});
