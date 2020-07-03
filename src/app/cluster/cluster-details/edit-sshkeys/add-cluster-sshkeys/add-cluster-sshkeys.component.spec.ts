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
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '../../../../app-config.service';
import {ApiService, ClusterService, NotificationService, ProjectService, UserService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {ApiMockService} from '../../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../../testing/services/app-config-mock.service';
import {ClusterMockService} from '../../../../testing/services/cluster-mock-service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../../../testing/services/project-mock.service';
import {UserMockService} from '../../../../testing/services/user-mock.service';
import {AddClusterSSHKeysComponent} from './add-cluster-sshkeys.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule];

describe('AddClusterSSHKeysComponent', () => {
  let fixture: ComponentFixture<AddClusterSSHKeysComponent>;
  let component: AddClusterSSHKeysComponent;

  beforeEach(async(() => {
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
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddClusterSSHKeysComponent);
    component = fixture.componentInstance;
  }));

  it('should create the add cluster sshkeys component', async(() => {
    expect(component).toBeTruthy();
  }));
});
