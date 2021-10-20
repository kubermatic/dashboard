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
import {fakeProject} from '@app/testing/fake-data/project';
import {fakeServiceAccount} from '@app/testing/fake-data/serviceaccount';
import {asyncData} from '@app/testing/services/api-mock';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {SharedModule} from '@shared/module';
import {AddServiceAccountComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('AddServiceAccountComponent', () => {
  let fixture: ComponentFixture<AddServiceAccountComponent>;
  let component: AddServiceAccountComponent;
  let createServiceAccountSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {createServiceAccount: jest.fn()};
      createServiceAccountSpy = apiMock.createServiceAccount.mockReturnValue(asyncData(fakeServiceAccount()));

      TestBed.configureTestingModule({
        imports: [...modules],
        providers: [
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: ApiService, useValue: apiMock},
          {provide: ProjectService, useClass: ProjectMockService},
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(AddServiceAccountComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it(
    'should create the add service account component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('form invalid after creating', () => {
    expect(component.addServiceAccountForm.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.addServiceAccountForm.valid).toBeFalsy();
    expect(component.addServiceAccountForm.controls.name.valid).toBeFalsy();
    expect(component.addServiceAccountForm.controls.name.hasError('required')).toBeTruthy();

    component.addServiceAccountForm.controls.name.patchValue('test-service-account');
    expect(component.addServiceAccountForm.controls.name.hasError('required')).toBeFalsy();
  });

  it('should call addServiceAccount method', fakeAsync(() => {
    component.project = fakeProject();
    component.addServiceAccountForm.controls.name.patchValue('test-service-account');
    component.addServiceAccountForm.controls.group.patchValue('editors');
    component.addServiceAccount();
    tick();
    flush();

    expect(createServiceAccountSpy).toHaveBeenCalled();
  }));
});
