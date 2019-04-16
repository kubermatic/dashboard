import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog, MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {ApiService, ProjectService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {fakeServiceAccount, fakeServiceAccountTokens} from '../../testing/fake-data/serviceaccount.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {TokenDialogComponent} from '../token-dialog/token-dialog.component';

import {AddServiceAccountTokenComponent} from './add-serviceaccount-token.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('AddServiceAccountTokenComponent', () => {
  let fixture: ComponentFixture<AddServiceAccountTokenComponent>;
  let component: AddServiceAccountTokenComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createServiceAccountToken']);
    apiMock.createServiceAccountToken.and.returnValue(asyncData(fakeServiceAccountTokens()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AddServiceAccountTokenComponent,
            TokenDialogComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
            MatDialog,
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddServiceAccountTokenComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    component.serviceaccount = fakeServiceAccount();
    fixture.detectChanges();
  }));

  it('should create the add service account token component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('form invalid after  creating', () => {
    expect(component.addServiceAccountTokenForm.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.addServiceAccountTokenForm.valid).toBeFalsy('form is initially not valid');
    expect(component.addServiceAccountTokenForm.controls.name.valid).toBeFalsy('name field is initially not valid');
    expect(component.addServiceAccountTokenForm.controls.name.hasError('required'))
        .toBeTruthy('name field has initially required error');

    component.addServiceAccountTokenForm.controls.name.patchValue('test-service-account-token');
    expect(component.addServiceAccountTokenForm.controls.name.hasError('required'))
        .toBeFalsy('name field has no required error after setting name');
  });
});
