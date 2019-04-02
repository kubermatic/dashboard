import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;
import {ApiService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeServiceAccount} from '../../testing/fake-data/serviceaccount.fake';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {EditServiceAccountComponent} from './edit-serviceaccount.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('EditServiceAccountComponent', () => {
  let fixture: ComponentFixture<EditServiceAccountComponent>;
  let component: EditServiceAccountComponent;
  let editServiceAccountsSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['editServiceAccounts']);
    editServiceAccountsSpy = apiMock.editServiceAccounts.and.returnValue(asyncData(fakeServiceAccount()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditServiceAccountComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditServiceAccountComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    component.serviceaccount = fakeServiceAccount();
    fixture.detectChanges();
  }));

  it('should create the edit service account component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should have invalid form after creating', () => {
    expect(component.editServiceAccountForm.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.editServiceAccountForm.valid).toBeFalsy('form is initially not valid');
    expect(component.editServiceAccountForm.controls.name.valid).toBeFalsy('name field is initially not valid');
    expect(component.editServiceAccountForm.controls.name.hasError('required'))
        .toBeTruthy('name field has initially required error');
    expect(component.editServiceAccountForm.controls.group.valid).toBeFalsy('group field is initially not valid');
    expect(component.editServiceAccountForm.controls.group.hasError('required'))
        .toBeTruthy('group field has initially required error');

    component.editServiceAccountForm.controls.name.patchValue('test-service-account');
    expect(component.editServiceAccountForm.controls.name.hasError('required'))
        .toBeFalsy('name field has no required error after setting name');
    component.editServiceAccountForm.controls.group.patchValue('editor');
    expect(component.editServiceAccountForm.controls.group.hasError('required'))
        .toBeFalsy('group field has no required error after setting group');
  });

  it('should call editServiceAccount method', fakeAsync(() => {
       component.editServiceAccountForm.controls.name.patchValue('test-service-account');
       component.editServiceAccountForm.controls.group.patchValue('editor');
       component.editServiceAccount();
       tick();

       expect(editServiceAccountsSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
