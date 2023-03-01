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
import {MatLegacyTabsModule as MatTabsModule} from '@angular/material/legacy-tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {DialogTestModule, NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {fakeMembers} from '@test/data/member';
import {RouterStub, RouterTestingModule} from '@test/services/router-stubs';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {MemberComponent} from './component';
import {MemberService} from '@core/services/member';
import {MemberServiceMock} from '@test/services/member-mock';

describe('MemberComponent', () => {
  let fixture: ComponentFixture<MemberComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: MemberComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        SharedModule,
        MatTabsModule,
        DialogTestModule,
      ],
      declarations: [MemberComponent],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: MemberService, useClass: MemberServiceMock},
        MatDialog,
        GoogleAnalyticsService,
        NotificationService,
        {
          provide: Router,
          useValue: {
            routerState: {
              snapshot: {url: ''},
            },
          },
        },
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create members cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should open delete member confirmation dialog & call delete()', fakeAsync(() => {
    const spy = jest.spyOn(fixture.debugElement.injector.get(MemberService) as any, 'remove');

    const waitTime = 15000;
    component.deleteMember(fakeMembers()[0]);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Remove Member');
    expect(deleteButton.textContent).toContain('Remove');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(spy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
