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
import {MemberService} from '@core/services/member';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {fakeMember} from '@test/data/member';
import {fakeProject} from '@test/data/project';
import {asyncData} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {EditMemberComponent} from './component';

describe('EditMemberComponent', () => {
  let fixture: ComponentFixture<EditMemberComponent>;
  let component: EditMemberComponent;
  let editMemberSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const memberServiceMock = {edit: jest.fn()};
    editMemberSpy = memberServiceMock.edit.mockReturnValue(asyncData(fakeMember()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MemberService, useValue: memberServiceMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(EditMemberComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    component.member = fakeMember();
    fixture.detectChanges();
  }));

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should have valid form defaults', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should have required fields', () => {
    component.form.controls.group.patchValue('');
    expect(component.form.controls.group.valid).toBeFalsy();
    expect(component.form.controls.group.hasError('required')).toBeTruthy();

    component.form.controls.group.patchValue('editor');
    expect(component.form.controls.group.hasError('required')).toBeFalsy();
  });

  xit('should call editMember method', fakeAsync(() => {
    component.form.controls.group.patchValue('editor');
    // component.editMember();
    tick();
    flush();

    expect(editMemberSpy).toHaveBeenCalled();
  }));
});
