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
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {DialogTestModule, NoopConfirmDialogComponent} from '@app/testing/components/noop-confirmation-dialog.component';
import {NoopTokenDialogComponent, TokenDialogTestModule} from '@app/testing/components/noop-token-dialog.component';
import {fakeServiceAccount, fakeServiceAccountTokens} from '@app/testing/fake-data/serviceaccount.fake';
import {RouterStub} from '@app/testing/router-stubs';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {ProjectMockService} from '@app/testing/services/project-mock.service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {ProjectService} from '@core/services/project/service';
import {UserService} from '@core/services/user/service';
import {SharedModule} from '@shared/shared.module';
import {of} from 'rxjs';
import {ServiceAccountModule} from '../serviceaccount.module';
import {ServiceAccountTokenComponent} from './serviceaccount-token.component';

describe('ServiceAccountTokenComponent', () => {
  let fixture: ComponentFixture<ServiceAccountTokenComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let noopToken: ComponentFixture<NoopTokenDialogComponent>;
  let component: ServiceAccountTokenComponent;
  let deleteServiceAccountTokenSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {deleteServiceAccountToken: jest.fn()};
      deleteServiceAccountTokenSpy = apiMock.deleteServiceAccountToken.mockReturnValue(of(null));

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
          {provide: ApiService, useValue: apiMock},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: UserService, useClass: UserMockService},
          MatDialog,
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

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

  it('should open delete service account token dialog & call deleteServiceAccountToken()', fakeAsync(() => {
    const waitTime = 15000;
    component.deleteServiceAccountToken(fakeServiceAccountTokens()[0]);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Token');
    expect(deleteButton.textContent).toBe(' Delete ');

    deleteButton.click();

    noop.detectChanges();
    noopToken.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteServiceAccountTokenSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
