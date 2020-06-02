import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {WizardService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeAWSCluster} from '../../../../testing/fake-data/cluster.fake';

import {AWSClusterSettingsComponent} from './aws.component';

describe('AWSClusterSettingsComponent', () => {
  let fixture: ComponentFixture<AWSClusterSettingsComponent>;
  let component: AWSClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [AWSClusterSettingsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster();
    component.cluster.spec.cloud.aws = {
      accessKeyId: '',
      secretAccessKey: '',
      routeTableId: '',
      securityGroupID: '',
      vpcId: '',
      instanceProfileName: '',
      roleARN: '',
    };
    fixture.detectChanges();
  });

  it('should create the aws cluster cmp', () => {
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
    expect(component.form.controls.accessKeyId.hasError('required')).toBeTruthy();
    expect(component.form.controls.secretAccessKey.hasError('required')).toBeTruthy();

    component.form.controls.accessKeyId.patchValue('foo');
    fixture.detectChanges();
    expect(component.form.controls.accessKeyId.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.secretAccessKey.patchValue('bar');
    fixture.detectChanges();
    expect(component.form.controls.secretAccessKey.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeTruthy();
  });
});
