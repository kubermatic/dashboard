// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
