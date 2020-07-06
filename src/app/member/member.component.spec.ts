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

import {async, ComponentFixture, fakeAsync, flush, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AppConfigService} from '../app-config.service';
import {ApiService, NotificationService, ProjectService, UserService} from '../core/services';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {SharedModule} from '../shared/shared.module';
import {DialogTestModule, NoopConfirmDialogComponent} from '../testing/components/noop-confirmation-dialog.component';
import {fakeMembers} from '../testing/fake-data/member.fake';
import {RouterStub, RouterTestingModule} from '../testing/router-stubs';
import {asyncData} from '../testing/services/api-mock.service';
import {AppConfigMockService} from '../testing/services/app-config-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {SettingsMockService} from '../testing/services/settings-mock.service';
import {UserMockService} from '../testing/services/user-mock.service';

import {MemberComponent} from './member.component';

describe('MemberComponent', () => {
  let fixture: ComponentFixture<MemberComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: MemberComponent;
  let deleteMembersSpy;

  beforeEach(async(() => {
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

  it('should open delete member confirmation dialog & call deleteMembers()', fakeAsync(() => {
    component.deleteMember(fakeMembers()[0]);
    noop.detectChanges();
    tick(15000);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Member');
    expect(deleteButton.textContent).toBe(' Delete ');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(15000);

    expect(deleteMembersSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));
});
