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
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '@app/config.service';
import {ApiMockService} from '@app/testing/services/api-mock.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {ClusterMockService} from '@app/testing/services/cluster-mock-service';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@app/testing/services/project-mock.service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {ApiService} from '@core/services/api/api.service';
import {ClusterService} from '@core/services/cluster/cluster.service';
import {NotificationService} from '@core/services/notification/notification.service';
import {ProjectService} from '@core/services/project/project.service';
import {UserService} from '@core/services/user/user.service';
import {SharedModule} from '@shared/shared.module';
import {AddClusterSSHKeysComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('AddClusterSSHKeysComponent', () => {
  let fixture: ComponentFixture<AddClusterSSHKeysComponent>;
  let component: AddClusterSSHKeysComponent;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [AddClusterSSHKeysComponent],
        providers: [
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: ApiService, useValue: ApiMockService},
          {provide: ClusterService, useClass: ClusterMockService},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: UserService, useClass: UserMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          MatDialog,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(AddClusterSSHKeysComponent);
      component = fixture.componentInstance;
    })
  );

  it(
    'should create the add cluster sshkeys component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );
});
