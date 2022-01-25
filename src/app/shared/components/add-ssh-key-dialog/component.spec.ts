// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatToolbarModule} from '@angular/material/toolbar';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeProject} from '@app/testing/fake-data/project';
import {RouterStub, RouterTestingModule} from '@app/testing/router-stubs';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {AddSshKeyDialogComponent} from './component';
import {SSHKeyService} from '@core/services/ssh-key';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  RouterTestingModule,
  ReactiveFormsModule,
  FormsModule,
  MatDialogModule,
  MatFormFieldModule,
  MatToolbarModule,
  MatInputModule,
  MatSnackBarModule,
  CoreModule,
];

describe('AddSshKeyDialogComponent', () => {
  let fixture: ComponentFixture<AddSshKeyDialogComponent>;
  let component: AddSshKeyDialogComponent;
  let dialogRef: MatDialogRef<AddSshKeyDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: Router, useClass: RouterStub},
        SSHKeyService,
        GoogleAnalyticsService,
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyDialogComponent);
    component = fixture.componentInstance;
    component.projectID = fakeProject().id;
    fixture.detectChanges();
    dialogRef = fixture.debugElement.injector.get(MatDialogRef) as MatDialogRef<AddSshKeyDialogComponent>;
  });

  it(
    'should create the add node modal cmp',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('form invalid when empty', () => {
    expect(component.addSSHKeyForm.valid).toBeFalsy();
  });

  it('name field validity', () => {
    const name = component.addSSHKeyForm.controls['name'];
    let errors = name.errors || {};
    expect(errors['required']).toBeTruthy();

    name.setValue('test');
    errors = name.errors || {};
    expect(errors['required']).toBeFalsy();
  });

  it('submitting a form calls createSSHKey method and closes dialog', fakeAsync(() => {
    expect(component.addSSHKeyForm.valid).toBeFalsy();
    component.addSSHKeyForm.controls['name'].setValue('testname');
    component.addSSHKeyForm.controls['key'].setValue(
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCyVGaw1PuEl98f4/7Kq3O9ZIvDw2OFOSXAFVqilSFNkHlefm1iMtPeqsIBp2t9cbGUf55xNDULz/bD/4BCV43yZ5lh0cUYuXALg9NI29ui7PEGReXjSpNwUD6ceN/78YOK41KAcecq+SS0bJ4b4amKZIJG3JWmDKljtv1dmSBCrTmEAQaOorxqGGBYmZS7NQumRe4lav5r6wOs8OACMANE1ejkeZsGFzJFNqvr5DuHdDL5FAudW23me3BDmrM9ifUzzjl1Jwku3bnRaCcjaxH8oTumt1a00mWci/1qUlaVFft085yvVq7KZbF2OPPbl+erDW91+EZ2FgEi+v1/CSJ5 your_username@hostname'
    );
    expect(component.addSSHKeyForm.valid).toBeTruthy();

    const spyDialogRefClose = jest.spyOn(dialogRef, 'close');
    component.addSSHKey();
    tick();
    fixture.detectChanges();
    flush();

    expect(spyDialogRefClose).toHaveBeenCalledTimes(1);
  }));

  it('validation should fail when SSH key is invalid', fakeAsync(() => {
    expect(component.addSSHKeyForm.valid).toBeFalsy();
    component.addSSHKeyForm.controls['name'].setValue('test');
    component.addSSHKeyForm.controls['key'].setValue('ssh-rsa 7Kq3O9ZIvDwt9cbGUf55xN');
    expect(component.addSSHKeyForm.valid).toBeFalsy();

    component.addSSHKeyForm.controls['key'].setValue('ssh-rda 7Kq3O9ZIvDwt9cbGUf55xN');
    expect(component.addSSHKeyForm.valid).toBeFalsy();

    component.addSSHKeyForm.controls['key'].setValue('test');
    expect(component.addSSHKeyForm.valid).toBeFalsy();
  }));
});
