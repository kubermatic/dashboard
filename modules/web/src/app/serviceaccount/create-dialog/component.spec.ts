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
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {ServiceAccountService} from '@core/services/service-account';
import {SharedModule} from '@shared/module';
import {fakeProject} from '@test/data/project';
import {fakeServiceAccount} from '@test/data/serviceaccount';
import {asyncData} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {CreateServiceAccountDialogComponent} from './component';

describe('CreateServiceAccountDialogComponent', () => {
  let fixture: ComponentFixture<CreateServiceAccountDialogComponent>;
  let component: CreateServiceAccountDialogComponent;
  let createServiceAccountSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const saMock = {create: jest.fn()};
    createServiceAccountSpy = saMock.create.mockReturnValue(asyncData(fakeServiceAccount()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ServiceAccountService, useValue: saMock},
        {provide: ProjectService, useClass: ProjectMockService},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(CreateServiceAccountDialogComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    fixture.detectChanges();
  }));

  it('should create the component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('form invalid after creating', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.name.valid).toBeFalsy();
    expect(component.form.controls.name.hasError('required')).toBeTruthy();

    component.form.controls.name.patchValue('test-service-account');
    expect(component.form.controls.name.hasError('required')).toBeFalsy();
  });

  it('should call addServiceAccount method', fakeAsync(() => {
    component.form.controls.name.patchValue('test-service-account');
    component.form.controls.group.patchValue('editors');
    component.getObservable().subscribe();
    tick();
    flush();

    expect(createServiceAccountSpy).toHaveBeenCalled();
  }));
});
