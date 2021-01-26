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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {fakeMember} from '@app/testing/fake-data/member.fake';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {asyncData} from '@app/testing/services/api-mock.service';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {SharedModule} from '@shared/shared.module';
import {EditMemberComponent} from './edit-member.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('EditMemberComponent', () => {
  let fixture: ComponentFixture<EditMemberComponent>;
  let component: EditMemberComponent;
  let editMemberSpy;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {editMembers: jest.fn()};
      editMemberSpy = apiMock.editMembers.mockReturnValue(asyncData(fakeMember()));

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
      fixture = TestBed.createComponent(EditMemberComponent);
      component = fixture.componentInstance;
      component.project = fakeProject();
      component.member = fakeMember();
      fixture.detectChanges();
    })
  );

  it(
    'should initialize',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should have valid form defaults', () => {
    expect(component.editMemberForm.valid).toBeTruthy();
  });

  it('should have required fields', () => {
    component.editMemberForm.controls.group.patchValue('');
    expect(component.editMemberForm.controls.group.valid).toBeFalsy();
    expect(component.editMemberForm.controls.group.hasError('required')).toBeTruthy();

    component.editMemberForm.controls.group.patchValue('editor');
    expect(component.editMemberForm.controls.group.hasError('required')).toBeFalsy();
  });

  it('should call editMember method', fakeAsync(() => {
    component.editMemberForm.controls.group.patchValue('editor');
    component.editMember();
    tick();
    flush();

    expect(editMemberSpy).toHaveBeenCalled();
  }));
});
