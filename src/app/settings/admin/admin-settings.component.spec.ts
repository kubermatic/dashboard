import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';

import {DatacenterService, NotificationService, UserService, HistoryService} from '../../core/services';
import {SettingsService} from '../../core/services/settings/settings.service';
import {SharedModule} from '../../shared/shared.module';
import {MatDialogMock} from '../../testing/services/mat-dialog-mock';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {SettingsMockService} from '../../testing/services/settings-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';

import {AdminSettingsComponent} from './admin-settings.component';
import {CustomLinksFormComponent} from './custom-link-form/custom-links-form.component';
import {ClusterType} from '../../shared/entity/ClusterEntity';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {AddAdminDialogComponent} from './admins/add-admin-dialog/add-admin-dialog.component';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let component: AdminSettingsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, RouterTestingModule, BrowserAnimationsModule, SharedModule],
      declarations: [AdminSettingsComponent, AddAdminDialogComponent, CustomLinksFormComponent],
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

  it('should initialize', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should correctly check if the last one distribution is selected', () => {
    const group = {} as MatButtonToggleGroup;
    group.value = [ClusterType.Kubernetes];
    expect(component.isLastDistro(group, ClusterType.Kubernetes)).toBeTruthy();
    expect(component.isLastDistro(group, ClusterType.OpenShift)).toBeFalsy();
  });
});
