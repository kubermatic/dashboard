import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;
import {ApiService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeMember} from '../../testing/fake-data/member.fake';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {EditMemberComponent} from './edit-member.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('EditMemberComponent', () => {
  let fixture: ComponentFixture<EditMemberComponent>;
  let component: EditMemberComponent;
  let editMemberSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['editMembers']);
    editMemberSpy = apiMock.editMembers.and.returnValue(asyncData(fakeMember()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditMemberComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
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

  it('should create the edit member component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should have invalid form after creating', () => {
    expect(component.editMemberForm.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.editMemberForm.valid).toBeFalsy('form is initially not valid');
    expect(component.editMemberForm.controls.group.valid).toBeFalsy('group field is initially not valid');
    expect(component.editMemberForm.controls.group.hasError('required'))
        .toBeTruthy('group field has initially required error');

    component.editMemberForm.controls.group.patchValue('editor');
    expect(component.editMemberForm.controls.group.hasError('required'))
        .toBeFalsy('group field has no required error after setting group');
  });

  it('should call editMember method', fakeAsync(() => {
       component.editMemberForm.controls.group.patchValue('editor');
       component.editMember();
       tick();

       expect(editMemberSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
