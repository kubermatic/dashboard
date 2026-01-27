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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {CoreModule} from '@core/module';
import {DatacenterService} from '@core/services/datacenter';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {NoopProjectDeleteDialogComponent} from '@test/components/noop-project-delete-dialog.component';
import {fakeProject} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {RouterStub} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {CookieService} from 'ngx-cookie-service';
import {ProjectComponent} from './component';
import {ProjectModule} from './module';

describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;
  let noop: ComponentFixture<NoopProjectDeleteDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ProjectModule, SharedModule, CoreModule],
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
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

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

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    const deleteButton = document.body.querySelector('#km-delete-project-dialog-confirm-btn') as HTMLInputElement;
    const dialogInput = document.querySelector('#km-delete-project-dialog-input');

    dialogInput.setAttribute('value', project.name);
    deleteButton.disabled = false;

    noop.detectChanges();
    fixture.detectChanges();

    expect(dialogTitle.textContent).toBe('Delete Project');
    expect(document.querySelector('#km-delete-project-dialog-input').getAttribute('value')).toBe(project.name);
  }));

  it('should use search endpoint to update data source', fakeAsync(() => {
    const projectService = TestBed.inject(ProjectService) as ProjectMockService;
    const searchSpy = jest.spyOn(projectService, 'searchProjects');

    component.onSearch('new-project-1');
    tick();

    expect(searchSpy).toHaveBeenCalledWith('new-project-1', false);
    expect(component.dataSource.data.length).toBe(1);
  }));
});
