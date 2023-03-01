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
import {MatLegacyDialog as MatDialog} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {DialogTestModule, NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {NoopTokenDialogComponent, TokenDialogTestModule} from '@test/components/noop-token-dialog.component';
import {fakeServiceAccount, fakeServiceAccountTokens} from '@test/data/serviceaccount';
import {RouterStub} from '@test/services/router-stubs';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {UserMockService} from '@test/services/user-mock';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {ServiceAccountModule} from '../module';
import {ServiceAccountTokenComponent} from './component';
import {ServiceAccountService} from '@core/services/service-account';
import {ServiceAccountMockService} from '@test/services/service-account-mock';

describe('ServiceAccountTokenComponent', () => {
  let fixture: ComponentFixture<ServiceAccountTokenComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let noopToken: ComponentFixture<NoopTokenDialogComponent>;
  let component: ServiceAccountTokenComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        CoreModule,
        ServiceAccountModule,
        DialogTestModule,
        TokenDialogTestModule,
      ],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: ServiceAccountService, useClass: ServiceAccountMockService},
        MatDialog,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccountTokenComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    noopToken = TestBed.createComponent(NoopTokenDialogComponent);
    component.serviceaccountTokens = fakeServiceAccountTokens();
    component.serviceaccount = fakeServiceAccount();
    component.isInitializing = false;
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should open delete service account token dialog & call deleteToken()', fakeAsync(() => {
    const spy = jest.spyOn(fixture.debugElement.injector.get(ServiceAccountService) as any, 'deleteToken');

    const waitTime = 15000;
    component.deleteToken(fakeServiceAccountTokens()[0]);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Token');
    expect(deleteButton.textContent).toContain('Delete');

    deleteButton.click();

    noop.detectChanges();
    noopToken.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(spy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
