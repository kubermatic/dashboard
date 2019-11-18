import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {UserService} from '../../core/services';
import {HistoryService} from '../../core/services/history/history.service';
import {SettingsService} from '../../core/services/settings/settings.service';
import {SharedModule} from '../../shared/shared.module';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {SettingsMockService} from '../../testing/services/settings-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';

import {AddAdminDialogComponent} from './add-admin-dialog/add-admin-dialog.component';
import {AdminSettingsComponent} from './admin-settings.component';

describe('AdminSettingsComponent', () => {
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let component: AdminSettingsComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            RouterTestingModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            SharedModule,
          ],
          declarations: [
            AdminSettingsComponent,
            AddAdminDialogComponent,
          ],
          providers: [
            {provide: UserService, useClass: UserMockService},
            {provide: SettingsService, useClass: SettingsMockService},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            HistoryService,
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));
});
