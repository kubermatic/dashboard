import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, NotificationService, ProjectService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {Group} from '../../shared/utils/member-utils/member-utils';
import {fakeMember} from '../../testing/fake-data/member.fake';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../testing/services/project-mock.service';

import {AddMemberComponent} from './add-member.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('AddProjectComponent', () => {
  let fixture: ComponentFixture<AddMemberComponent>;
  let component: AddMemberComponent;
  let createMembersSpy;

  beforeEach(async(() => {
    const apiMock = {'createMembers': jest.fn()};
    createMembersSpy = apiMock.createMembers.mockReturnValue(asyncData(fakeMember()));

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
            NotificationService,
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
    expect(component.addMemberForm.valid).toBeFalsy();
    expect(component.addMemberForm.controls.email.valid).toBeFalsy();
    expect(component.addMemberForm.controls.email.hasError('required')).toBeTruthy();
    expect(component.addMemberForm.controls.group.valid).toBeFalsy();
    expect(component.addMemberForm.controls.group.hasError('required')).toBeTruthy();

    component.addMemberForm.controls.email.patchValue('john@doe.com');
    expect(component.addMemberForm.controls.email.hasError('required')).toBeFalsy();
    component.addMemberForm.controls.group.patchValue(Group.Editor);
    expect(component.addMemberForm.controls.group.hasError('required')).toBeFalsy();
  });

  it('should call addMember method', fakeAsync(() => {
       component.project = fakeProject();
       component.addMemberForm.controls.email.patchValue('john@doe.com');
       component.addMemberForm.controls.group.patchValue('editors');
       component.addMember();
       tick();

       expect(createMembersSpy).toHaveBeenCalled();
     }));
});
