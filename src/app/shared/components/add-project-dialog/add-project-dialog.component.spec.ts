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

import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';

import {CoreModule} from '../../../core/core.module';
import {ApiService, ProjectService} from '../../../core/services';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {SharedModule} from '../../shared.module';

import {AddProjectDialogComponent} from './add-project-dialog.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('AddProjectDialogComponent', () => {
  let fixture: ComponentFixture<AddProjectDialogComponent>;
  let component: AddProjectDialogComponent;
  let createProjectSpy;

  beforeEach(async(() => {
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
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddProjectDialogComponent);
    component = fixture.componentInstance;
    component.labels = {};
    component.asyncLabelValidators = [];
    fixture.detectChanges();
  }));

  it('should create the add project component', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call createProject method', fakeAsync(() => {
    component.form.controls.name.patchValue('new-project-name');
    component.addProject();
    tick();

    expect(createProjectSpy).toHaveBeenCalled();
  }));
});
