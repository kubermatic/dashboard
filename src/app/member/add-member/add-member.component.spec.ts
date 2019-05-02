import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;
import {ApiService, ProjectService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeMember} from '../../testing/fake-data/member.fake';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {AddMemberComponent} from './add-member.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('AddProjectComponent', () => {
  let fixture: ComponentFixture<AddMemberComponent>;
  let component: AddMemberComponent;
  let createMembersSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createMembers']);
    createMembersSpy = apiMock.createMembers.and.returnValue(asyncData(fakeMember()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AddMemberComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the add member component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('form invalid after creating', () => {
    expect(component.addMemberForm.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.addMemberForm.valid).toBeFalsy('form is initially not valid');
    expect(component.addMemberForm.controls.email.valid).toBeFalsy('email field is initially not valid');
    expect(component.addMemberForm.controls.email.hasError('required'))
        .toBeTruthy('email field has initially required error');
    expect(component.addMemberForm.controls.group.valid).toBeFalsy('group field is initially not valid');
    expect(component.addMemberForm.controls.group.hasError('required'))
        .toBeTruthy('group field has initially required error');

    component.addMemberForm.controls.email.patchValue('john@doe.com');
    expect(component.addMemberForm.controls.email.hasError('required'))
        .toBeFalsy('email field has no required error after setting email');
    component.addMemberForm.controls.group.patchValue('editors');
    expect(component.addMemberForm.controls.group.hasError('required'))
        .toBeFalsy('group field has no required error after setting group');
  });

  it('should call addMember method', fakeAsync(() => {
       component.project = fakeProject();
       component.addMemberForm.controls.email.patchValue('john@doe.com');
       component.addMemberForm.controls.group.patchValue('editors');
       component.addMember();
       tick();

       expect(createMembersSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
