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
import {DialogTestModule, NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeAlertmanagerConfig} from '@test/data/mla';
import {fakeProject} from '@test/data/project';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {CoreModule} from '@core/module';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {MLAService} from '@core/services/mla';
import {SettingsService} from '@core/services/settings';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {AlertmanagerConfigComponent} from './component';
import {AppConfigService} from '@app/config.service';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {Router} from '@angular/router';
import {RouterStub} from '@test/services/router-stubs';
import {UserService} from '@core/services/user';
import {UserMockService} from '@test/services/user-mock';
import {AddonService} from '@core/services/addon';
import {AddonServiceMock} from '@test/services/addon-mock';

describe('AlertmanagerConfigComponent', () => {
  let fixture: ComponentFixture<AlertmanagerConfigComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: AlertmanagerConfigComponent;
  let resetAlertmanagerConfigSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const mlaMock = {
      resetAlertmanagerConfig: jest.fn(),
      refreshAlertmanagerConfig: () => {},
    };
    resetAlertmanagerConfigSpy = mlaMock.resetAlertmanagerConfig.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, DialogTestModule],
      declarations: [AlertmanagerConfigComponent],
      providers: [
        {provide: MLAService, useValue: mlaMock},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Router, useClass: RouterStub},
        {provide: UserService, useClass: UserMockService},
        {provide: AddonService, useClass: AddonServiceMock},
        MatDialog,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AlertmanagerConfigComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    component.alertmanagerConfig = fakeAlertmanagerConfig();
    component.isClusterRunning = true;
    fixture.detectChanges();
  }));

  it('should create the alertmanager config component', fakeAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should open the reset alertmanager config confirmation dialog & call reset()', fakeAsync(() => {
    const waitTime = 15000;
    component.reset();
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const resetButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Reset Alertmanager Config');
    expect(resetButton.textContent).toContain('Reset');

    resetButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(resetAlertmanagerConfigSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
