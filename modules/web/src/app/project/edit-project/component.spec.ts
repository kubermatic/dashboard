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
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {fakeProject} from '@test/data/project';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {SharedModule} from '@shared/module';
import {ProjectModule} from '../module';
import {EditProjectComponent} from './component';
import {ProjectService} from '@core/services/project';
import {asyncData} from '@test/services/cluster-mock';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AppConfigService} from '@app/config.service';
import {UserMockService} from '@test/services/user-mock';
import {UserService} from '@app/core/services/user';

describe('EditProjectComponent', () => {
  let fixture: ComponentFixture<EditProjectComponent>;
  let component: EditProjectComponent;
  let editProjectSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const projectServiceMock = {edit: jest.fn()};
    editProjectSpy = projectServiceMock.edit.mockReturnValue(asyncData(fakeProject()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, ProjectModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ProjectService, useValue: projectServiceMock},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: UserService, useClass: UserMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditProjectComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    component.labels = {};
    component.asyncLabelValidators = [];
    fixture.detectChanges();
  }));

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should have valid form after creating', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should have required fields', () => {
    component.form.controls.name.patchValue('');
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.name.valid).toBeFalsy();
    expect(component.form.controls.name.hasError('required')).toBeTruthy();

    component.form.controls.name.patchValue('new-project-name');
    expect(component.form.controls.name.hasError('required')).toBeFalsy();
  });

  xit('should call editProject method', fakeAsync(() => {
    component.form.controls.name.patchValue('new-project-name');
    // component.editProject();
    tick();
    flush();

    expect(editProjectSpy).toHaveBeenCalled();
  }));
});
