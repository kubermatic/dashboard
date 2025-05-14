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
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {SSHKeyService} from '@app/core/services/ssh-key/ssh-key';
import {SharedModule} from '@shared/module';
import {fakeProject} from '@test/data/project';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {RouterStub} from '@test/services/router-stubs';
import {SSHKeyMockService} from '@test/services/ssh-key-mock';
import {click} from '@test/utils/click-handler';
import {AddSshKeyDialogComponent} from './component';

describe('AddSshKeyDialogComponent', () => {
  let fixture: ComponentFixture<AddSshKeyDialogComponent>;
  let component: AddSshKeyDialogComponent;
  let dialogRef: MatDialogRef<AddSshKeyDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: Router, useClass: RouterStub},
        {provide: SSHKeyService, useClass: SSHKeyMockService},
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

  it('should create the add node modal cmp', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('form invalid when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('name field validity', () => {
    const name = component.form.controls['name'];
    let errors = name.errors || {};
    expect(errors['required']).toBeTruthy();

    name.setValue('test');
    errors = name.errors || {};
    expect(errors['required']).toBeFalsy();
  });

  it('submitting a form closes dialog', fakeAsync(() => {
    expect(component.form.valid).toBeFalsy();
    component.form.controls['name'].setValue('testname');
    component.form.controls['key'].setValue(
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCyVGaw1PuEl98f4/7Kq3O9ZIvDw2OFOSXAFVqilSFNkHlefm1iMtPeqsIBp2t9cbGUf55xNDULz/bD/4BCV43yZ5lh0cUYuXALg9NI29ui7PEGReXjSpNwUD6ceN/78YOK41KAcecq+SS0bJ4b4amKZIJG3JWmDKljtv1dmSBCrTmEAQaOorxqGGBYmZS7NQumRe4lav5r6wOs8OACMANE1ejkeZsGFzJFNqvr5DuHdDL5FAudW23me3BDmrM9ifUzzjl1Jwku3bnRaCcjaxH8oTumt1a00mWci/1qUlaVFft085yvVq7KZbF2OPPbl+erDW91+EZ2FgEi+v1/CSJ5 your_username@hostname'
    );
    expect(component.form.valid).toBeTruthy();

    const spyDialogRefClose = jest.spyOn(dialogRef, 'close');

    fixture.detectChanges();
    const submitButton = fixture.debugElement.query(By.css('button'));

    click(submitButton);

    tick();
    fixture.detectChanges();
    flush();

    expect(spyDialogRefClose).toHaveBeenCalledTimes(1);
  }));

  it('validation should fail when SSH key is invalid', fakeAsync(() => {
    expect(component.form.valid).toBeFalsy();
    component.form.controls['name'].setValue('test');
    component.form.controls['key'].setValue('ssh-rsa 7Kq3O9ZIvDwt9cbGUf55xN');
    expect(component.form.valid).toBeFalsy();

    component.form.controls['key'].setValue('ssh-rda 7Kq3O9ZIvDwt9cbGUf55xN');
    expect(component.form.valid).toBeFalsy();

    component.form.controls['key'].setValue('test');
    expect(component.form.valid).toBeFalsy();
  }));
});
