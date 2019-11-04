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
import {CoreModule} from '../../core/core.module';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
  CoreModule,
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
    component.labels = {};
    fixture.detectChanges();
  }));

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should have valid form after creating', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should have required fields', () => {
    component.form.controls.name.patchValue('');
    expect(component.form.valid).toBeFalsy('form is not valid');
    expect(component.form.controls.name.valid).toBeFalsy('name field is not valid');
    expect(component.form.controls.name.hasError('required')).toBeTruthy('name field has required error');

    component.form.controls.name.patchValue('new-project-name');
    expect(component.form.controls.name.hasError('required'))
        .toBeFalsy('name field has no required error after setting name');
  });

  it('should call editProject method', fakeAsync(() => {
       component.form.controls.name.patchValue('new-project-name');
       component.editProject();
       tick();

       expect(editProjectSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
