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
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';

import {DatacenterService, HistoryService, NotificationService, UserService} from '../../core/services';
import {SettingsService} from '../../core/services/settings/settings.service';
import {ClusterType} from '../../shared/entity/cluster';
import {SharedModule} from '../../shared/shared.module';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {MatDialogMock} from '../../testing/services/mat-dialog-mock';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {SettingsMockService} from '../../testing/services/settings-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';
import {AddAdminDialogComponent} from './admins/add-admin-dialog/component';
import {AdminsComponent} from './admins/component';

import {AdminSettingsComponent} from './component';
import {CustomLinksFormComponent} from './custom-link-form/component';
import {DynamicDatacentersComponent} from './dynamic-datacenters/component';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let component: AdminSettingsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, RouterTestingModule, BrowserAnimationsModule, SharedModule],
      declarations: [
        AdminSettingsComponent,
        DynamicDatacentersComponent,
        AdminsComponent,
        AddAdminDialogComponent,
        CustomLinksFormComponent,
      ],
      providers: [
        {provide: UserService, useClass: UserMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: DatacenterService, useClass: DatacenterMockService},
        HistoryService,
        NotificationService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
  });

  it(
    'should initialize',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should correctly check if the last one distribution is selected', () => {
    const group = {} as MatButtonToggleGroup;
    group.value = [ClusterType.Kubernetes];
    expect(component.isLastDistro(group, ClusterType.Kubernetes)).toBeTruthy();
    expect(component.isLastDistro(group, ClusterType.OpenShift)).toBeFalsy();
  });
});
