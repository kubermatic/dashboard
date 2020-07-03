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

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {WizardService} from '../../core/services/wizard/wizard.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeVSphereCluster} from '../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {VSphereNodeDataComponent} from './vsphere-node-data.component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, ReactiveFormsModule];

describe('VSphereNodeDataComponent', () => {
  let fixture: ComponentFixture<VSphereNodeDataComponent>;
  let component: VSphereNodeDataComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [VSphereNodeDataComponent],
      providers: [NodeDataService, WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeVSphereCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('form valid when initializing since vsphere has sane defaults for required fields', () => {
    fixture.detectChanges();
    expect(component.form.valid).toBeTruthy();
  });
});
