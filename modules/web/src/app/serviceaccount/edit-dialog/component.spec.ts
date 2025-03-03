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

import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@core/module';
import { NotificationService } from '@core/services/notification';
import { ServiceAccountService } from '@core/services/service-account';
import { SharedModule } from '@shared/module';
import { fakeProject } from '@test/data/project';
import { fakeServiceAccount } from '@test/data/serviceaccount';
import { asyncData } from '@test/services/cluster-mock';
import { MatDialogRefMock } from '@test/services/mat-dialog-ref-mock';
import { EditServiceAccountDialogComponent } from './component';

describe('EditServiceAccountDialogComponent', () => {
  let fixture: ComponentFixture<EditServiceAccountDialogComponent>;
  let component: EditServiceAccountDialogComponent;
  let editServiceAccountSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const saMock = {edit: jest.fn()};
    editServiceAccountSpy = saMock.edit.mockReturnValue(asyncData(fakeServiceAccount()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ServiceAccountService, useValue: saMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditServiceAccountDialogComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    component.serviceaccount = fakeServiceAccount();
    fixture.detectChanges();
  }));

  it('should create the edit service account component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should have valid form after creating', () => {
    expect(component.form.valid).toBeTruthy();
  });

  xit('should call editServiceAccount method', fakeAsync(() => {
    component.form.controls.name.patchValue('test-service-account');
    component.form.controls.group.patchValue('editors');
    // component.edit();
    tick();
    flush();

    expect(editServiceAccountSpy).toHaveBeenCalled();
  }));
});
