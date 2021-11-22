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
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {DialogTestModule, NoopConfirmDialogComponent} from '@app/testing/components/noop-confirmation-dialog.component';
import {fakeProject} from '@app/testing/fake-data/project';
import {fakeSSHKeys} from '@app/testing/fake-data/sshkey';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '@app/testing/router-stubs';
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
import {SSHKeyComponent} from './component';

describe('SSHKeyComponent', () => {
  let fixture: ComponentFixture<SSHKeyComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: SSHKeyComponent;
  let activatedRoute: ActivatedRouteStub;
  let deleteSSHKeySpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {getSSHKeys: jest.fn(), deleteSSHKey: jest.fn()};
      apiMock.getSSHKeys.mockReturnValue(asyncData(fakeSSHKeys()));
      deleteSSHKeySpy = apiMock.deleteSSHKey.mockReturnValue(of(null));

      TestBed.configureTestingModule({
        imports: [
          BrowserModule,
          BrowserAnimationsModule,
          RouterTestingModule,
          SharedModule,
          MatTabsModule,
          DialogTestModule,
        ],
        declarations: [SSHKeyComponent],
        providers: [
          {provide: Router, useClass: RouterStub},
          {provide: ApiService, useValue: apiMock},
          {provide: UserService, useClass: UserMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: ActivatedRoute, useClass: ActivatedRouteStub},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: SettingsService, useClass: SettingsMockService},
          MatDialog,
          GoogleAnalyticsService,
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {project: '4k6txp5sq'};

    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should open delete ssh key confirmation dialog & call deleteSSHKey()', fakeAsync(() => {
    const waitTime = 15000;
    component.project = fakeProject();
    component.sshKeys = fakeSSHKeys();
    const event = new MouseEvent('click');

    component.deleteSshKey(component.sshKeys[0], event);

    fixture.detectChanges();
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete SSH Key');
    expect(deleteButton.textContent).toContain('Delete');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteSSHKeySpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
