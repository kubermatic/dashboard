import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialogRef, MatFormFieldModule, MatInputModule, MatToolbarModule } from '@angular/material';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterStub, RouterTestingModule } from './../../../testing/router-stubs';
import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { ApiService } from '../../../core/services/index';
import { AddSshKeyModalComponent } from './add-ssh-key-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectMockService } from './../../../testing/services/project-mock.service';
import { GoogleAnalyticsService } from '../../../google-analytics.service';
import { ProjectService } from '../../../core/services';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  RouterTestingModule,
  ReactiveFormsModule,
  FormsModule,
  MatDialogModule,
  MatFormFieldModule,
  MatToolbarModule,
  MatInputModule
];

describe('AddSshKeyModalComponent', () => {
  let fixture: ComponentFixture<AddSshKeyModalComponent>;
  let component: AddSshKeyModalComponent;
  let apiService: ApiService;
  let dialogRef: MatDialogRef<AddSshKeyModalComponent, any>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AddSshKeyModalComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
        { provide: Router, useClass: RouterStub },
        { provide: ProjectService, useClass: ProjectMockService }
        GoogleAnalyticsService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    apiService = fixture.debugElement.injector.get(ApiService);
    dialogRef = fixture.debugElement.injector.get(MatDialogRef) as MatDialogRef<AddSshKeyModalComponent, any>;
  });

  it('should create the add node modal cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('form invalid when empty', () => {
    expect(component.addSSHKeyForm.valid).toBeFalsy();
  });

  it('name field validity', () => {
    let errors = {};
    const name = component.addSSHKeyForm.controls['name'];
    errors = name.errors || {};
    expect(errors['required']).toBeTruthy();

    name.setValue('test');
    errors = name.errors || {};
    expect(errors['required']).toBeFalsy();
  });

  it('submitting a form calls addSSHKey method and closes dialog', fakeAsync(() => {
    expect(component.addSSHKeyForm.valid).toBeFalsy();
    component.addSSHKeyForm.controls['name'].setValue('testname');
    component.addSSHKeyForm.controls['key'].setValue('testkey');
    expect(component.addSSHKeyForm.valid).toBeTruthy();

    const spyDialogRefClose = spyOn(dialogRef, 'close');
    const spyAddShhKey = spyOn(apiService, 'addSSHKey').and.returnValue(Observable.of(null));
    component.addSSHKey();
    tick();
    fixture.detectChanges();

    expect(spyAddShhKey.and.callThrough()).toHaveBeenCalledTimes(1);
    expect(spyDialogRefClose.and.callThrough()).toHaveBeenCalledTimes(1);
  }));
});
