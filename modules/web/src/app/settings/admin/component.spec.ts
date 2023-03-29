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
import {MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {AppConfigService} from '@app/config.service';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {MatDialogMock} from '@test/services/mat-dialog-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {fakeConstraintTemplates} from '@test/data/opa';
import {DatacenterService} from '@core/services/datacenter';
import {HistoryService} from '@core/services/history';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {AddAdminDialogComponent} from './admins/add-admin-dialog/component';
import {AdminsComponent} from './admins/component';
import {AdminSettingsComponent} from './component';
import {CustomLinksFormComponent} from './custom-link-form/component';
import {DynamicDatacentersComponent} from './dynamic-datacenters/component';
import {ConstraintTemplatesComponent} from './opa/constraint-templates/component';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let component: AdminSettingsComponent;

  beforeEach(() => {
    const opaMock = {
      deleteConstraintTemplate: jest.fn(),
      constraintTemplates: of(fakeConstraintTemplates()),
      refreshConstraintTemplates: () => {},
    };
    opaMock.deleteConstraintTemplate.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, RouterTestingModule, BrowserAnimationsModule, SharedModule],
      declarations: [
        AdminSettingsComponent,
        DynamicDatacentersComponent,
        AdminsComponent,
        AddAdminDialogComponent,
        CustomLinksFormComponent,
        ConstraintTemplatesComponent,
      ],
      providers: [
        {provide: UserService, useClass: UserMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: OPAService, useValue: opaMock},
        {provide: AppConfigService, useClass: AppConfigMockService},
        HistoryService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
