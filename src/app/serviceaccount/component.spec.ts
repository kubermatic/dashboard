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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ServiceAccountModule} from '@app/serviceaccount/module';
import {DialogTestModule, NoopConfirmDialogComponent} from '@app/testing/components/noop-confirmation-dialog.component';
import {fakeServiceAccounts, fakeServiceAccountTokens} from '@app/testing/fake-data/serviceaccount';
import {RouterStub} from '@app/testing/router-stubs';
import {asyncData} from '@app/testing/services/api-mock';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {SettingsMockService} from '@app/testing/services/settings-mock';
import {UserMockService} from '@app/testing/services/user-mock';
import {ApiService} from '@core/services/api';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {AppConfigService} from '../config.service';
import {ServiceAccountComponent} from './component';

describe('ServiceAccountComponent', () => {
  let fixture: ComponentFixture<ServiceAccountComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: ServiceAccountComponent;
  let deleteServiceAccountSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {
        getServiceAccounts: jest.fn(),
        getServiceAccountTokens: jest.fn(),
        deleteServiceAccount: jest.fn(),
      };
      apiMock.getServiceAccounts.mockReturnValue(asyncData(fakeServiceAccounts()));
      apiMock.getServiceAccountTokens.mockReturnValue(asyncData(fakeServiceAccountTokens()));
      deleteServiceAccountSpy = apiMock.deleteServiceAccount.mockReturnValue(of(null));

      TestBed.configureTestingModule({
        imports: [BrowserModule, BrowserAnimationsModule, SharedModule, ServiceAccountModule, DialogTestModule],
        providers: [
          {provide: Router, useClass: RouterStub},
          {provide: ApiService, useValue: apiMock},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: UserService, useClass: UserMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: SettingsService, useClass: SettingsMockService},
          MatDialog,
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccountComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    component.tokenList = fakeServiceAccountTokens();
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create service accounts cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct group display name', () => {
    expect(component.getGroupDisplayName('editors')).toBe('Editor');
  });

  it('should open delete service account confirmation dialog & call deleteServiceAccount()', fakeAsync(() => {
    const waitTime = 15000;
    const event = new MouseEvent('click');
    component.deleteServiceAccount(fakeServiceAccounts()[0], event);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Service Account');
    expect(deleteButton.textContent).toContain('Delete');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteServiceAccountSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
