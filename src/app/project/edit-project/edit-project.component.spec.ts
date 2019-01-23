import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;
import {ApiService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {EditProjectComponent} from './edit-project.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('EditProjectComponent', () => {
  let fixture: ComponentFixture<EditProjectComponent>;
  let component: EditProjectComponent;
  let editProjectSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['editProject']);
    editProjectSpy = apiMock.editProject.and.returnValue(asyncData(fakeProject()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditProjectComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditProjectComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    fixture.detectChanges();
  }));

  it('should create the edit project component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should have invalid form after creating', () => {
    expect(component.editProjectForm.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.editProjectForm.valid).toBeFalsy('form is initially not valid');
    expect(component.editProjectForm.controls.name.valid).toBeFalsy('name field is initially not valid');
    expect(component.editProjectForm.controls.name.hasError('required'))
        .toBeTruthy('name field has initially required error');

    component.editProjectForm.controls.name.patchValue('new-project-name');
    expect(component.editProjectForm.controls.name.hasError('required'))
        .toBeFalsy('name field has no required error after setting name');
  });

  it('should call editProject method', fakeAsync(() => {
       component.editProjectForm.controls.name.patchValue('new-project-name');
       component.editProject();
       tick();

       expect(editProjectSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
