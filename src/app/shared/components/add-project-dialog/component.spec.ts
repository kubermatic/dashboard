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
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster';
import {RouterStub} from '@app/testing/router-stubs';
import {asyncData} from '@app/testing/services/api-mock';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api';
import {ProjectService} from '@core/services/project';
import {SharedModule} from '@shared/module';
import {AddProjectDialogComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('AddProjectDialogComponent', () => {
  let fixture: ComponentFixture<AddProjectDialogComponent>;
  let component: AddProjectDialogComponent;
  let createProjectSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {createProject: jest.fn()};
      createProjectSpy = apiMock.createProject.mockReturnValue(asyncData(fakeDigitaloceanCluster));

      TestBed.configureTestingModule({
        imports: [...modules],
        providers: [
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: ApiService, useValue: apiMock},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: Router, useClass: RouterStub},
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(AddProjectDialogComponent);
      component = fixture.componentInstance;
      component.labels = {};
      component.asyncLabelValidators = [];
      fixture.detectChanges();
    })
  );

  it(
    'should create the add project component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should call createProject method', fakeAsync(() => {
    component.form.controls.name.patchValue('new-project-name');
    component.addProject();
    tick();
    flush();

    expect(createProjectSpy).toHaveBeenCalled();
  }));
});
