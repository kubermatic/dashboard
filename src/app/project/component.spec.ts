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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {CoreModule} from '@core/module';
import {DatacenterService} from '@core/services/datacenter';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {CookieService} from 'ngx-cookie-service';
import {
  DialogTestModule,
  NoopProjectDeleteDialogComponent,
} from '@app/testing/components/noop-project-delete-dialog.component';
import {fakeProject} from '@app/testing/fake-data/project';
import {RouterStub, RouterTestingModule} from '@app/testing/router-stubs';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {DatacenterMockService} from '@app/testing/services/datacenter-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {SettingsMockService} from '@app/testing/services/settings-mock';
import {UserMockService} from '@app/testing/services/user-mock';
import {ProjectComponent} from './component';
import {ProjectModule} from './module';

describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;
  let noop: ComponentFixture<NoopProjectDeleteDialogComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserModule,
          BrowserAnimationsModule,
          RouterTestingModule,
          ProjectModule,
          SharedModule,
          CoreModule,
          DialogTestModule,
        ],
        providers: [
          {provide: Router, useClass: RouterStub},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: UserService, useClass: UserMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: DatacenterService, useClass: DatacenterMockService},
          {provide: SettingsService, useClass: SettingsMockService},
          MatDialog,
          GoogleAnalyticsService,
          CookieService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopProjectDeleteDialogComponent);
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should open delete project confirmation dialog & call deleteProject()', fakeAsync(() => {
    const waitTime = 15000;
    const project = fakeProject();
    const event = new MouseEvent('click');

    component.deleteProject(project, event);
    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-delete-project-dialog-confirm-btn') as HTMLInputElement;
    const dialogInput = document.querySelector('#km-delete-project-dialog-input');

    dialogInput.setAttribute('value', project.name);
    deleteButton.disabled = false;

    noop.detectChanges();
    fixture.detectChanges();

    expect(dialogTitle.textContent).toBe('Delete Project');
    expect(document.querySelector('#km-delete-project-dialog-input').getAttribute('value')).toBe(project.name);
  }));
});
