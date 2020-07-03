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
import {ApiService, WizardService} from '../../../../../core/services';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeVSphereCluster} from '../../../../../testing/fake-data/cluster.fake';
import {ApiMockService} from '../../../../../testing/services/api-mock.service';
import {VSphereProviderOptionsComponent} from './vsphere-provider-options.component';

describe('VSphereProviderOptionsComponent', () => {
  let fixture: ComponentFixture<VSphereProviderOptionsComponent>;
  let component: VSphereProviderOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [VSphereProviderOptionsComponent],
      providers: [{provide: ApiService, useClass: ApiMockService}, WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereProviderOptionsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeVSphereCluster();
    component.cluster.spec.cloud.vsphere.username = '';
    component.cluster.spec.cloud.vsphere.password = '';
    component.cluster.spec.cloud.vsphere.infraManagementUser.username = '';
    component.cluster.spec.cloud.vsphere.infraManagementUser.password = '';
    fixture.detectChanges();
  });

  it('should create the vsphere cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
