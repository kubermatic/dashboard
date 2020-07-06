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
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeVSphereCluster} from '../../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';
import {VSphereNodeOptionsComponent} from './vsphere-node-options.component';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {Auth, WizardService, DatacenterService} from '../../../core/services';
import {AppConfigService} from '../../../app-config.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, ReactiveFormsModule, HttpClientModule];

describe('VSphereNodeOptionsComponent', () => {
  let fixture: ComponentFixture<VSphereNodeOptionsComponent>;
  let component: VSphereNodeOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [VSphereNodeOptionsComponent],
      providers: [
        NodeDataService,
        WizardService,
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereNodeOptionsComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeVSphereCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the vshpere options cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should have valid form when initializing', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should call getVSphereOptionsData method', () => {
    component.form.controls.template.patchValue('test-template');
    component.form.controls.diskSizeGB.patchValue(256);
    fixture.detectChanges();
    expect(component.getVSphereOptionsData()).toEqual({
      spec: {
        vsphere: {
          cpus: 1,
          memory: 512,
          template: 'test-template',
          diskSizeGB: 256,
        },
      },
      valid: true,
    });
  });
});
