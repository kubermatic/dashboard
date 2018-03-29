import { SSHKeysFake } from './../../../testing/fake-data/sshkey.fake';
import { InputValidationService } from './../../../core/services/input-validation/input-validation.service';
import { ApiService } from './../../../core/services/api/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SshKeyFormFieldComponent } from './ssh-key-form-field.component';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { ReactiveFormsModule } from '@angular/forms';

const modules: any[] = [
  BrowserModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule
];

function setMockNgRedux(sshkeys: string[]): void {
  const sshStub = MockNgRedux.getSelectorStub(['wizard', 'sshKeyForm', 'ssh_keys']);
  sshStub.next(sshkeys);
}

function completeRedux() {
  const sshStub = MockNgRedux.getSelectorStub(['wizard', 'sshKeyForm', 'ssh_keys']);
  sshStub.complete();
}

describe('SshKeyFormFieldComponent', () => {
  let fixture: ComponentFixture<SshKeyFormFieldComponent>;
  let component: SshKeyFormFieldComponent;

  beforeEach(async(() => {
    MockNgRedux.reset();
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SshKeyFormFieldComponent
      ],
      providers: [
        { provide: ApiService, useClass: ApiMockService },
        InputValidationService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshKeyFormFieldComponent);
    component = fixture.componentInstance;
  });

  it('should create the ssh-key-form-field cmp', () => {
    expect(component).toBeTruthy();
  });

  it('shoud get sshkeys from redux', () => {
    setMockNgRedux(['ssh-test']);
    completeRedux();

    fixture.detectChanges();

    expect(component.selectedSshKeys).toEqual(['ssh-test'], 'should get sshkeys names from redux');
  });

  it('form invalid after creating', () => {
    fixture.detectChanges();

    expect(component.sshKeyForm.valid).toBeFalsy();
  });

  it('ssh_keys field validity', () => {
    setMockNgRedux([]);
    completeRedux();

    fixture.detectChanges();

    let errors = {};
    const ssh_keys = component.sshKeyForm.controls['ssh_keys'];
    errors = ssh_keys.errors || {};
    expect(errors['required']).toBeTruthy();

    ssh_keys.setValue(['test-ssh']);
    errors = ssh_keys.errors || {};
    expect(errors['required']).toBeFalsy();
    expect(component.sshKeyForm.valid).toBeTruthy();
  });

  it('should get sshkeys from api', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(component.sshKeys).toEqual(SSHKeysFake, 'should get sshKeys from api');
  }));
});
