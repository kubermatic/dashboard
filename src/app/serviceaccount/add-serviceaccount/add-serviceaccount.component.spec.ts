import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;
import {ApiService, ProjectService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeServiceAccount} from '../../testing/fake-data/serviceaccount.fake';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {AddServiceAccountComponent} from './add-serviceaccount.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('AddServiceAccountComponent', () => {
  let fixture: ComponentFixture<AddServiceAccountComponent>;
  let component: AddServiceAccountComponent;
  let createServiceAccountSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createServiceAccount']);
    createServiceAccountSpy = apiMock.createServiceAccount.and.returnValue(asyncData(fakeServiceAccount()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AddServiceAccountComponent,
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
    fixture = TestBed.createComponent(AddServiceAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the add service account component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('form invalid after creating', () => {
    expect(component.addServiceAccountForm.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.addServiceAccountForm.valid).toBeFalsy('form is initially not valid');
    expect(component.addServiceAccountForm.controls.name.valid).toBeFalsy('name field is initially not valid');
    expect(component.addServiceAccountForm.controls.name.hasError('required'))
        .toBeTruthy('name field has initially required error');
    expect(component.addServiceAccountForm.controls.group.valid).toBeFalsy('group field is initially not valid');
    expect(component.addServiceAccountForm.controls.group.hasError('required'))
        .toBeTruthy('group field has initially required error');

    component.addServiceAccountForm.controls.name.patchValue('test-service-account');
    expect(component.addServiceAccountForm.controls.name.hasError('required'))
        .toBeFalsy('name field has no required error after setting name');
    component.addServiceAccountForm.controls.group.patchValue('editors');
    expect(component.addServiceAccountForm.controls.group.hasError('required'))
        .toBeFalsy('group field has no required error after setting group');
  });

  it('should call addServiceAccount method', fakeAsync(() => {
       component.project = fakeProject();
       component.addServiceAccountForm.controls.name.patchValue('test-service-account');
       component.addServiceAccountForm.controls.group.patchValue('editors');
       component.addServiceAccount();
       tick();

       expect(createServiceAccountSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
