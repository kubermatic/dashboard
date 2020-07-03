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
import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService, WizardService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../testing/fake-data/cluster.fake';
import {SetProviderComponent} from './set-provider.component';
import {ClusterType} from '../../shared/entity/cluster';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';

describe('SetProviderComponent', () => {
  let fixture: ComponentFixture<SetProviderComponent>;
  let component: SetProviderComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule,
        MatButtonToggleModule,
        HttpClientModule,
      ],
      declarations: [SetProviderComponent],
      providers: [{provide: DatacenterService, useClass: DatacenterMockService}, WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetProviderComponent);
    component = fixture.componentInstance;
  });

  it('should create the set-provider cmp', fakeAsync(() => {
    expect(component).toBeTruthy();
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    tick();
  }));

  it('should get provider from cluster', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
    tick();
    expect(component.setProviderForm.controls.provider.valid).toBeTruthy();
    expect(component.setProviderForm.controls.provider.value === 'digitalocean').toBeTruthy();
  }));

  it('should be initially invalid', fakeAsync(() => {
    component.cluster = {
      name: '',
      spec: {
        cloud: {
          dc: '',
        },
        version: '',
      },
      type: ClusterType.Empty,
    };
    fixture.detectChanges();
    tick();
    expect(component.setProviderForm.controls.provider.valid).toBeFalsy();
  }));
});
