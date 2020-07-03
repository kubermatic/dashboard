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

import {WizardService} from '../../../../../core/services';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeAWSCluster} from '../../../../../testing/fake-data/cluster.fake';

import {AWSProviderOptionsComponent} from './aws-provider-options.component';

describe('AWSProviderOptionsComponent', () => {
  let fixture: ComponentFixture<AWSProviderOptionsComponent>;
  let component: AWSProviderOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [AWSProviderOptionsComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSProviderOptionsComponent);
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
});
