import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {CoreModule} from '../../core/core.module';
import {ApiService, NotificationService, ProjectService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {fakeServiceAccount} from '../../testing/fake-data/serviceaccount.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../testing/services/project-mock.service';

import {AddServiceAccountComponent} from './add-serviceaccount.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  CoreModule,
];

describe('AddServiceAccountComponent', () => {
  let fixture: ComponentFixture<AddServiceAccountComponent>;
  let component: AddServiceAccountComponent;
  let createServiceAccountSpy;

  beforeEach(async(() => {
    const apiMock = {'createServiceAccount': jest.fn()};
    createServiceAccountSpy = apiMock.createServiceAccount.mockReturnValue(asyncData(fakeServiceAccount()));

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
            NotificationService,
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
    expect(component.addServiceAccountForm.valid).toBeFalsy();
    expect(component.addServiceAccountForm.controls.name.valid).toBeFalsy();
    expect(component.addServiceAccountForm.controls.name.hasError('required')).toBeTruthy();

    component.addServiceAccountForm.controls.name.patchValue('test-service-account');
    expect(component.addServiceAccountForm.controls.name.hasError('required')).toBeFalsy();
  });

  it('should call addServiceAccount method', fakeAsync(() => {
       component.project = fakeProject();
       component.addServiceAccountForm.controls.name.patchValue('test-service-account');
       component.addServiceAccountForm.controls.group.patchValue('editors');
       component.addServiceAccount();
       tick();

       expect(createServiceAccountSpy).toHaveBeenCalled();
     }));
});
