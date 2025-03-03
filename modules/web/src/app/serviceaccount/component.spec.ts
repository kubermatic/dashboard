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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ServiceAccountModule} from '@app/serviceaccount/module';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {ServiceAccountService} from '@core/services/service-account';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {fakeServiceAccounts, fakeServiceAccountTokens} from '@test/data/serviceaccount';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {asyncData} from '@test/services/cluster-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {of} from 'rxjs';
import {AppConfigService} from '../config.service';
import {ServiceAccountComponent} from './component';

describe('ServiceAccountComponent', () => {
  let fixture: ComponentFixture<ServiceAccountComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: ServiceAccountComponent;
  let deleteServiceAccountSpy;

  beforeEach(waitForAsync(() => {
    const saMock = {
      get: jest.fn(),
      getTokens: jest.fn(),
      delete: jest.fn(),
    };
    saMock.get.mockReturnValue(asyncData(fakeServiceAccounts()));
    saMock.getTokens.mockReturnValue(asyncData(fakeServiceAccountTokens()));
    deleteServiceAccountSpy = saMock.delete.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, ServiceAccountModule],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: ServiceAccountService, useValue: saMock},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        MatDialog,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccountComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
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

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
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
