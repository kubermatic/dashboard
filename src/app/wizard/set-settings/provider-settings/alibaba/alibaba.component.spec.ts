import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {WizardService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeAlibabaCluster} from '../../../../testing/fake-data/cluster.fake';

import {AlibabaClusterSettingsComponent} from './alibaba.component';

describe('AlibabaClusterSettingsComponent', () => {
  let fixture: ComponentFixture<AlibabaClusterSettingsComponent>;
  let component: AlibabaClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [AlibabaClusterSettingsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlibabaClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAlibabaCluster();
    component.cluster.spec.cloud.alibaba = {
      accessKeyID: '',
      accessKeySecret: '',
    };
    fixture.detectChanges();
  });

  it('should create the alibaba cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form initially invalid', () => {
    fixture.detectChanges();
    expect(component.form.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.form.reset();
    fixture.detectChanges();

    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.accessKeyID.hasError('required')).toBeTruthy();
    expect(component.form.controls.accessKeySecret.hasError('required')).toBeTruthy();

    component.form.controls.accessKeyID.patchValue('foo');
    fixture.detectChanges();
    expect(component.form.controls.accessKeyID.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.accessKeySecret.patchValue('bar');
    fixture.detectChanges();
    expect(component.form.controls.accessKeySecret.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeTruthy();
  });
});
