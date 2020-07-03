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
import {fakeDigitaloceanCluster} from '../../../../testing/fake-data/cluster.fake';
import {DigitaloceanClusterSettingsComponent} from './digitalocean.component';

describe('DigitaloceanClusterSettingsComponent', () => {
  let fixture: ComponentFixture<DigitaloceanClusterSettingsComponent>;
  let component: DigitaloceanClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [DigitaloceanClusterSettingsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.cluster.spec.cloud.digitalocean.token = '';
    fixture.detectChanges();
  });

  it('should create the digitalocean cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('token field validity', () => {
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.token.valid).toBeFalsy();
    expect(component.form.controls.token.hasError('required')).toBeTruthy();

    component.form.controls.token.patchValue('foo');
    expect(component.form.controls.token.hasError('required')).toBeFalsy();
    expect(component.form.controls.token.hasError('minlength')).toBeTruthy();

    component.form.controls.token.patchValue('1234567890123456789012345678901234567890123456789012345678901234567890');
    expect(component.form.controls.token.hasError('required')).toBeFalsy();
    expect(component.form.controls.token.hasError('minlength')).toBeFalsy();
    expect(component.form.controls.token.hasError('maxlength')).toBeTruthy();

    component.form.controls.token.patchValue('vhn92zesby42uw9f31wzn1e01ia4tso5tq2x52xyihidhma62yonrp4ebu9nlc6p');
    expect(component.form.controls.token.hasError('required')).toBeFalsy();
    expect(component.form.controls.token.hasError('minlength')).toBeFalsy();
    expect(component.form.controls.token.hasError('maxlength')).toBeFalsy();
  });
});
