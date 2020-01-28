import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {CoreModule} from '../../core/core.module';
import {ApiService, NotificationService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeMember} from '../../testing/fake-data/member.fake';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';

import {EditMemberComponent} from './edit-member.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  CoreModule,
];

describe('EditMemberComponent', () => {
  let fixture: ComponentFixture<EditMemberComponent>;
  let component: EditMemberComponent;
  let editMemberSpy;

  beforeEach(async(() => {
    const apiMock = {'editMembers': jest.fn()};
    editMemberSpy = apiMock.editMembers.mockReturnValue(asyncData(fakeMember()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
            NotificationService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditMemberComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    component.member = fakeMember();
    fixture.detectChanges();
  }));

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));

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

       expect(editMemberSpy).toHaveBeenCalled();
     }));
});
