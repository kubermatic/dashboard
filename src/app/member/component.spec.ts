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
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {DialogTestModule, NoopConfirmDialogComponent} from '@app/testing/components/noop-confirmation-dialog.component';
import {fakeMembers} from '@app/testing/fake-data/member';
import {RouterStub, RouterTestingModule} from '@app/testing/router-stubs';
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
import {MemberComponent} from './component';

describe('MemberComponent', () => {
  let fixture: ComponentFixture<MemberComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: MemberComponent;
  let deleteMembersSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {getMembers: jest.fn(), deleteMembers: jest.fn()};
      apiMock.getMembers.mockReturnValue(asyncData(fakeMembers()));
      deleteMembersSpy = apiMock.deleteMembers.mockReturnValue(of(null));

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
    fixture = TestBed.createComponent(MemberComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create members cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should open delete member confirmation dialog & call deleteMembers()', fakeAsync(() => {
    const waitTime = 15000;
    component.deleteMember(fakeMembers()[0]);
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Member');
    expect(deleteButton.textContent).toContain('Delete');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteMembersSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
