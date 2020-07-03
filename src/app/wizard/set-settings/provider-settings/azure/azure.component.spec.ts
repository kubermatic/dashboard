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
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeAzureCluster} from '../../../../testing/fake-data/cluster.fake';
import {AzureClusterSettingsComponent} from './azure.component';

describe('AzureClusterSettingsComponent', () => {
  let fixture: ComponentFixture<AzureClusterSettingsComponent>;
  let component: AzureClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [AzureClusterSettingsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAzureCluster();
    component.cluster.spec.cloud.azure = {
      clientID: '',
      clientSecret: '',
      resourceGroup: '',
      routeTable: '',
      securityGroup: '',
      subnet: '',
      subscriptionID: '',
      tenantID: '',
      vnet: '',
    };
    fixture.detectChanges();
  });

  it('should create the azure cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    fixture.detectChanges();
    expect(component.form.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.form.reset();
    fixture.detectChanges();

    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.clientID.hasError('required')).toBeTruthy();
    expect(component.form.controls.clientSecret.hasError('required')).toBeTruthy();
    expect(component.form.controls.tenantID.hasError('required')).toBeTruthy();
    expect(component.form.controls.subscriptionID.hasError('required')).toBeTruthy();

    component.form.controls.clientID.patchValue('foo');
    fixture.detectChanges();
    expect(component.form.controls.clientID.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.clientSecret.patchValue('bar');
    fixture.detectChanges();
    expect(component.form.controls.clientSecret.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.tenantID.patchValue('tenant');
    fixture.detectChanges();
    expect(component.form.controls.tenantID.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeFalsy();

    component.form.controls.subscriptionID.patchValue('subscription');
    fixture.detectChanges();
    expect(component.form.controls.subscriptionID.hasError('required')).toBeFalsy();
    expect(component.form.valid).toBeTruthy();
  });
});
