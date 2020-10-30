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
import {fakeServiceAccount} from '@app/testing/fake-data/serviceaccount.fake';
import {asyncData} from '@app/testing/services/api-mock.service';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {SharedModule} from '@shared/shared.module';
import {EditServiceAccountComponent} from './edit-serviceaccount.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('EditServiceAccountComponent', () => {
  let fixture: ComponentFixture<EditServiceAccountComponent>;
  let component: EditServiceAccountComponent;
  let editServiceAccountSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {editServiceAccount: jest.fn()};
      editServiceAccountSpy = apiMock.editServiceAccount.mockReturnValue(asyncData(fakeServiceAccount()));

      TestBed.configureTestingModule({
        imports: [...modules],
        providers: [
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: ApiService, useValue: apiMock},
          NotificationService,
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(EditServiceAccountComponent);
      component = fixture.componentInstance;
      component.project = fakeProject();
      component.serviceaccount = fakeServiceAccount();
      fixture.detectChanges();
    })
  );

  it(
    'should create the edit service account component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should have valid form after creating', () => {
    expect(component.editServiceAccountForm.valid).toBeTruthy();
  });

  it('should call editServiceAccount method', fakeAsync(() => {
    component.editServiceAccountForm.controls.name.patchValue('test-service-account');
    component.editServiceAccountForm.controls.group.patchValue('editors');
    component.editServiceAccount();
    tick();

    expect(editServiceAccountSpy).toHaveBeenCalled();
  }));
});
