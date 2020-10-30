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
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {asyncData} from '@app/testing/services/api-mock.service';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api/service';
import {SharedModule} from '@shared/shared.module';
import {ProjectModule} from '../project.module';
import {EditProjectComponent} from './edit-project.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, ProjectModule];

describe('EditProjectComponent', () => {
  let fixture: ComponentFixture<EditProjectComponent>;
  let component: EditProjectComponent;
  let editProjectSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {editProject: jest.fn()};
      editProjectSpy = apiMock.editProject.mockReturnValue(asyncData(fakeProject()));

      TestBed.configureTestingModule({
        imports: [...modules],
        providers: [
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: ApiService, useValue: apiMock},
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(EditProjectComponent);
      component = fixture.componentInstance;
      component.project = fakeProject();
      component.labels = {};
      component.asyncLabelValidators = [];
      fixture.detectChanges();
    })
  );

  it(
    'should initialize',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

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

  it('should call editProject method', fakeAsync(() => {
    component.form.controls.name.patchValue('new-project-name');
    component.editProject();
    tick();

    expect(editProjectSpy).toHaveBeenCalled();
  }));
});
